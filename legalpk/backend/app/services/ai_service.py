from typing import List, Optional, Tuple

import structlog
import anthropic

from app.core.config import settings

logger = structlog.get_logger(__name__)

PAKISTAN_LAW_SYSTEM_PROMPT = """You are an expert Pakistani lawyer and legal researcher with deep knowledge of:
- Pakistan Penal Code (PPC) 1860
- Code of Criminal Procedure (CrPC) 1898
- Code of Civil Procedure (CPC) 1908
- Constitution of the Islamic Republic of Pakistan 1973
- Qanun-e-Shahadat Order 1984 (Evidence Act)
- Family Courts Act 1964
- Muslim Family Laws Ordinance 1961
- West Pakistan Land Revenue Act 1967
- Industrial Relations Act 2012
- Contract Act 1872
- Transfer of Property Act 1882
- Specific Relief Act 1877
- Limitation Act 1908
- Supreme Court and High Court jurisprudence of Pakistan

Always cite specific sections, articles, and relevant case law from Pakistani courts.
Write formal legal language suitable for submission in Pakistani courts.
Use Urdu legal terms where conventional (e.g., "Mukadma", "Vakalatnama").
Format documents professionally as required by Pakistani court practice."""


class AIService:
    def __init__(self):
        self._client: Optional[anthropic.AsyncAnthropic] = None

    @property
    def client(self) -> anthropic.AsyncAnthropic:
        if self._client is None:
            self._client = anthropic.AsyncAnthropic(api_key=settings.ANTHROPIC_API_KEY)
        return self._client

    async def generate_document(
        self,
        document_type: str,
        case,
        title: str,
        additional_instructions: Optional[str] = None,
    ) -> str:
        doc_prompts = {
            "vakalatnama": "Draft a formal Vakalatnama (Power of Attorney for legal representation) for Pakistani court proceedings.",
            "bail_application": "Draft a comprehensive bail application citing relevant provisions of CrPC 1898 (sections 496-502) and applicable Pakistani case law.",
            "written_statement": "Draft a detailed written statement/reply in accordance with Order VIII CPC 1908, admitting or denying the plaint's allegations with supporting legal arguments.",
            "constitutional_petition": "Draft a Constitutional Petition under Article 199 of the Constitution of Pakistan 1973, citing relevant fundamental rights and grounds.",
            "civil_plaint": "Draft a civil plaint in accordance with Order VII CPC 1908 with proper cause of action, valuation, and relief sought.",
            "injunction": "Draft an application for temporary injunction under Order XXXIX CPC 1908 with three-pronged test: prima facie case, balance of convenience, irreparable loss.",
            "appeal": "Draft a formal appeal against the impugned judgment with specific grounds of appeal and applicable provisions.",
            "revision": "Draft a revision petition challenging the jurisdiction or material irregularity of the lower court's order.",
            "general_application": "Draft a formal application/miscellaneous application for Pakistani court proceedings.",
        }

        base_prompt = doc_prompts.get(document_type, doc_prompts["general_application"])

        case_context = f"""
Case Details:
- Title: {case.title}
- Case Number: {case.case_number or 'Not yet assigned'}
- Court: {case.court_name or 'Not specified'}
- District: {case.court_district or 'Not specified'}
- Judge: {case.judge_name or 'Not specified'}
- Case Type: {case.case_type}
- Status: {case.status}
- Client/Applicant: (Represented Party)
- Opponent: {case.opponent_name or 'Respondent'}
- Opponent's Advocate: {case.opponent_advocate or 'Not specified'}
- FIR Number: {case.fir_number or 'N/A'}
- Police Station: {case.ps_name or 'N/A'}
- Filing Date: {case.filing_date or 'Not specified'}
- Facts of the Case: {case.facts or 'Please fill in the facts'}
- Legal Issues: {case.legal_issues or 'Please specify legal issues'}
- Additional Notes: {case.notes or 'None'}
"""

        prompt = f"""
{base_prompt}

Document Title: {title}

{case_context}

{f'Additional Instructions: {additional_instructions}' if additional_instructions else ''}

Please draft the complete, formal legal document. Include:
1. Proper court heading and cause title
2. Numbered paragraphs
3. Relevant citations from PPC/CrPC/CPC/Constitution 1973/Qanun-e-Shahadat as applicable
4. Prayer/Relief sought
5. Verification clause
6. Signature block for the advocate

Ensure the document follows Pakistani court formatting conventions.
"""

        message = await self.client.messages.create(
            model=settings.ANTHROPIC_MODEL,
            max_tokens=settings.ANTHROPIC_MAX_TOKENS,
            system=PAKISTAN_LAW_SYSTEM_PROMPT,
            messages=[{"role": "user", "content": prompt}],
        )

        return message.content[0].text

    async def legal_research(self, query: str, context: Optional[str] = None) -> str:
        prompt = f"""
Legal Research Query: {query}

{f'Additional Context: {context}' if context else ''}

Please provide:
1. Relevant statutory provisions (cite specific sections/articles)
2. Applicable case law from Supreme Court of Pakistan and High Courts
3. Legal principles and their application
4. Practical guidance for a Pakistani advocate
5. Any recent legislative changes or landmark judgments relevant to this query

Format your response with clear headings and numbered citations.
"""

        message = await self.client.messages.create(
            model=settings.ANTHROPIC_MODEL,
            max_tokens=settings.ANTHROPIC_MAX_TOKENS,
            system=PAKISTAN_LAW_SYSTEM_PROMPT,
            messages=[{"role": "user", "content": prompt}],
        )
        return message.content[0].text

    async def summarize_case(self, case, hearings: list) -> Tuple[str, List[str]]:
        hearing_summary = ""
        if hearings:
            hearing_lines = []
            for h in hearings:
                line = f"  - {h.hearing_date}: {h.purpose} — {h.outcome or 'Pending'}"
                if h.next_date_set:
                    line += f" (Next: {h.next_date_set})"
                hearing_lines.append(line)
            hearing_summary = "Hearing History:\n" + "\n".join(hearing_lines)

        prompt = f"""
Please provide a concise legal summary of the following case for the advocate's reference:

Case: {case.title}
Case Number: {case.case_number or 'N/A'}
Type: {case.case_type}
Status: {case.status}
Court: {case.court_name or 'N/A'}, {case.court_district or ''}
Judge: {case.judge_name or 'N/A'}
Opponent: {case.opponent_name or 'N/A'}
Facts: {case.facts or 'Not recorded'}
Legal Issues: {case.legal_issues or 'Not recorded'}
Notes: {case.notes or 'None'}
{hearing_summary}

Provide:
1. A concise 2-3 paragraph summary of the case
2. A bulleted list of 3-7 key points/action items the advocate should focus on
3. Any critical dates or deadlines to note

Format the key points as a simple list (one per line, starting with "- ").
Separate the summary and key points with the marker: [KEY_POINTS]
"""

        message = await self.client.messages.create(
            model=settings.ANTHROPIC_MODEL,
            max_tokens=2048,
            system=PAKISTAN_LAW_SYSTEM_PROMPT,
            messages=[{"role": "user", "content": prompt}],
        )

        text = message.content[0].text
        if "[KEY_POINTS]" in text:
            parts = text.split("[KEY_POINTS]", 1)
            summary = parts[0].strip()
            key_points_raw = parts[1].strip().split("\n")
            key_points = [
                kp.lstrip("- •").strip()
                for kp in key_points_raw
                if kp.strip() and kp.strip() not in ("", "-")
            ]
        else:
            summary = text
            key_points = []

        return summary, key_points


ai_service = AIService()
