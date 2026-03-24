import asyncio
import os
import pickle
from pathlib import Path
from typing import List, Optional

import numpy as np
import structlog

from app.core.config import settings
from app.schemas.search import SearchResult

logger = structlog.get_logger(__name__)

# Meta file stores case metadata alongside the FAISS index
META_PATH = settings.FAISS_INDEX_PATH.replace(".index", ".meta.pkl")


class FAISSService:
    def __init__(self):
        self._index = None
        self._model = None
        self._meta: List[dict] = []  # [{case_id, title, case_type, status, snippet}]
        self._lock = asyncio.Lock()

    def _get_model(self):
        if self._model is None:
            from sentence_transformers import SentenceTransformer
            self._model = SentenceTransformer(settings.FAISS_EMBEDDING_MODEL)
        return self._model

    def _encode(self, texts: List[str]) -> np.ndarray:
        model = self._get_model()
        embeddings = model.encode(texts, convert_to_numpy=True, normalize_embeddings=True)
        return embeddings.astype(np.float32)

    def load_index(self) -> None:
        import faiss

        index_path = Path(settings.FAISS_INDEX_PATH)
        meta_path = Path(META_PATH)

        if index_path.exists() and meta_path.exists():
            self._index = faiss.read_index(str(index_path))
            with open(meta_path, "rb") as f:
                self._meta = pickle.load(f)
            logger.info("faiss_index_loaded", vectors=self._index.ntotal)
        else:
            # Create an empty IndexFlatIP index (Inner Product on L2-normalised = cosine)
            dim = 384  # paraphrase-multilingual-MiniLM-L12-v2
            self._index = faiss.IndexFlatIP(dim)
            self._meta = []
            logger.info("faiss_index_created_empty")

    def _save(self) -> None:
        import faiss

        index_path = Path(settings.FAISS_INDEX_PATH)
        index_path.parent.mkdir(parents=True, exist_ok=True)
        faiss.write_index(self._index, str(index_path))
        with open(META_PATH, "wb") as f:
            pickle.dump(self._meta, f)

    async def add_case(self, case) -> None:
        async with self._lock:
            if self._index is None:
                return

            text = self._case_to_text(case)
            vec = self._encode([text])
            case_id = str(case.id)

            # Replace if exists
            existing_idx = next(
                (i for i, m in enumerate(self._meta) if m["case_id"] == case_id), None
            )
            if existing_idx is not None:
                await asyncio.to_thread(self._rebuild_without, case_id)

            self._index.add(vec)
            self._meta.append(
                {
                    "case_id": case_id,
                    "title": case.title,
                    "case_type": case.case_type.value if hasattr(case.case_type, "value") else str(case.case_type),
                    "status": case.status.value if hasattr(case.status, "value") else str(case.status),
                    "snippet": (case.facts or "")[:200],
                }
            )
            await asyncio.to_thread(self._save)

    def _rebuild_without(self, exclude_case_id: str) -> None:
        import faiss

        keep_meta = [m for m in self._meta if m["case_id"] != exclude_case_id]
        if not keep_meta:
            dim = self._index.d
            self._index = faiss.IndexFlatIP(dim)
            self._meta = []
            return

        texts = [
            f"{m['title']} {m['snippet']}" for m in keep_meta
        ]
        vecs = self._encode(texts)
        dim = self._index.d
        new_index = faiss.IndexFlatIP(dim)
        new_index.add(vecs)
        self._index = new_index
        self._meta = keep_meta

    async def remove_case(self, case_id: str) -> None:
        async with self._lock:
            if self._index is None:
                return
            await asyncio.to_thread(self._rebuild_without, case_id)
            await asyncio.to_thread(self._save)

    async def search(
        self, query: str, top_k: Optional[int] = None
    ) -> List[SearchResult]:
        if self._index is None or self._index.ntotal == 0:
            return []

        k = min(top_k or settings.FAISS_TOP_K, self._index.ntotal)
        vec = self._encode([query])

        scores, indices = self._index.search(vec, k)
        results = []
        for score, idx in zip(scores[0], indices[0]):
            if idx < 0 or idx >= len(self._meta):
                continue
            meta = self._meta[idx]
            similarity_pct = int(max(0.0, min(1.0, float(score))) * 100)
            results.append(
                SearchResult(
                    case_id=meta["case_id"],
                    title=meta["title"],
                    case_type=meta["case_type"],
                    status=meta["status"],
                    score=float(score),
                    similarity_percent=similarity_pct,
                    snippet=meta.get("snippet"),
                )
            )
        return results

    async def rebuild_full(self, cases: list) -> None:
        import faiss

        async with self._lock:
            dim = 384
            new_index = faiss.IndexFlatIP(dim)
            new_meta = []

            if cases:
                texts = [self._case_to_text(c) for c in cases]
                vecs = self._encode(texts)
                new_index.add(vecs)
                for c in cases:
                    new_meta.append(
                        {
                            "case_id": str(c.id),
                            "title": c.title,
                            "case_type": c.case_type.value if hasattr(c.case_type, "value") else str(c.case_type),
                            "status": c.status.value if hasattr(c.status, "value") else str(c.status),
                            "snippet": (c.facts or "")[:200],
                        }
                    )

            self._index = new_index
            self._meta = new_meta
            await asyncio.to_thread(self._save)
            logger.info("faiss_index_rebuilt", vectors=new_index.ntotal)

    @staticmethod
    def _case_to_text(case) -> str:
        parts = [case.title or ""]
        if case.facts:
            parts.append(case.facts)
        if case.legal_issues:
            parts.append(case.legal_issues)
        if case.notes:
            parts.append(case.notes[:300])
        return " ".join(parts)


faiss_service = FAISSService()
