# LegalPakistan ⚖️

**Production-ready SaaS Legal Practice Management System for Pakistani Advocates**

Built for Pakistani lawyers to manage cases, clients, hearings, and legal documents — powered by AI (Claude + FAISS semantic search) and deployed on Railway.

---

## Features

- 📁 **Case Management** — Full case lifecycle: criminal, civil, family, constitutional, commercial, writ, revenue, labour
- 👤 **Client Management** — CNIC-based client profiles with NTN support for organisations
- 📅 **Hearing Tracker** — Upcoming hearings with automated email reminders
- 🤖 **AI Document Drafting** — Claude-powered vakalatnamas, bail applications, constitutional petitions, written statements
- 🔍 **Semantic Case Search** — FAISS vector similarity search across all case facts/notes
- 📚 **AI Legal Research** — Pakistan-specific: PPC, CrPC, CPC, Constitution 1973, Qanun-e-Shahadat
- 📄 **DOCX Export** — Court-ready Word documents (Times New Roman, A4, justified)
- 🔐 **JWT Auth** — Access + refresh token rotation with Redis rate limiting

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Python 3.11, FastAPI (async), SQLAlchemy 2.0 (asyncpg) |
| Database | PostgreSQL 16 |
| Cache / Queue | Redis 7, Celery 5, Celery Beat |
| AI | Anthropic Claude (`claude-sonnet-4-20250514`), FAISS, sentence-transformers |
| Document | python-docx (A4, Times New Roman, justified) |
| Frontend | React 18, TypeScript, Vite, TailwindCSS |
| State | Zustand, TanStack Query v5 |
| Auth | JWT (python-jose), bcrypt (passlib) |
| Deploy | Docker, Railway |

---

## Ports

| Service | URL |
|---|---|
| **Frontend (React/Vite)** | http://localhost:**3001** |
| **Backend API (FastAPI)** | http://localhost:**8000** |
| **API Docs (Swagger)** | http://localhost:8000/docs |
| **Celery Flower** | http://localhost:**5555** |
| PostgreSQL | localhost:5432 |
| Redis | localhost:6379 |

---

## Local Development

### Prerequisites

- Docker & Docker Compose v2
- Node 20+ (for frontend outside Docker)
- Python 3.11+ (for backend outside Docker)

### Quick Start with Docker

```bash
cd legalpk
cp .env.example .env
# Edit .env – add ANTHROPIC_API_KEY at minimum

docker compose up --build
```

Open http://localhost:3001 in your browser.

### Troubleshooting Docker Startup

If `docker compose up --build` fails with a container name conflict (for example, `legalpk-redis-1` already exists), clean up and retry:

```bash
docker compose down --remove-orphans
docker rm -f legalpk-redis-1 legalpk-db-1 2>/dev/null || true
docker compose up --build -d
```

If backend logs show FAISS/NumPy compatibility warnings, the API can still boot and serve requests. Verify with:

```bash
curl http://localhost:8000/health
```

### Manual / Codespace Setup

```bash
cd legalpk

# Backend
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt -r requirements-dev.txt

# Copy env
cp ../.env.example ../.env
# edit ../.env

# Create data dirs
mkdir -p data/{faiss,uploads,generated}

# Run migrations (after DB is running)
alembic upgrade head

# Start backend
uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload

# In another terminal – frontend
cd ../frontend
npm install
npm run dev  # → http://localhost:3001
```

### Running Celery Workers

```bash
# Worker
celery -A backend.app.workers.celery_app worker --concurrency=4 --loglevel=info

# Beat scheduler
celery -A backend.app.workers.celery_app beat --loglevel=info

# Flower monitor (http://localhost:5555)
celery -A backend.app.workers.celery_app flower --port=5555
```

---

## Environment Variables

See [`.env.example`](.env.example) for all variables. Critical ones:

| Variable | Description |
|---|---|
| `ANTHROPIC_API_KEY` | Your Anthropic API key |
| `JWT_SECRET_KEY` | Random secret for JWT signing |
| `APP_SECRET_KEY` | App-level secret |
| `DATABASE_URL` | PostgreSQL asyncpg URL |
| `ALLOWED_ORIGINS` | Comma-separated CORS origins |

---

## Database Migrations

```bash
# Generate new migration
alembic revision --autogenerate -m "description"

# Apply migrations
alembic upgrade head

# Rollback
alembic downgrade -1
```

---

## Testing

```bash
cd backend
pytest --cov=app --cov-report=term-missing
```

---

## Project Structure

```
legalpk/
├── backend/
│   ├── app/
│   │   ├── core/          # config, security, logging
│   │   ├── db/            # engine, session
│   │   ├── models/        # SQLAlchemy ORM
│   │   ├── schemas/       # Pydantic v2 schemas
│   │   ├── api/routes/    # FastAPI routers
│   │   ├── services/      # AI, FAISS, DOCX, cache, email
│   │   └── workers/       # Celery app + tasks
│   ├── migrations/        # Alembic
│   └── tests/
├── frontend/
│   └── src/
│       ├── components/    # UI + layout
│       ├── hooks/         # TanStack Query hooks
│       ├── pages/         # Route pages
│       ├── store/         # Zustand
│       └── types/
├── infrastructure/
│   ├── docker/            # Dockerfiles
│   └── nginx/             # nginx.prod.conf
├── .devcontainer/         # GitHub Codespaces
├── .vscode/               # VS Code tasks + launch
└── .github/workflows/     # CI + CD
```

---

## Deployment

See [DEPLOY.md](DEPLOY.md) for Railway deployment instructions.
