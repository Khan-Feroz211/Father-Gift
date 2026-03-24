# LegalPakistan ⚖️

**Production-ready SaaS Legal Practice Management System for Pakistani Advocates**

Built for Pakistani lawyers to manage cases, clients, hearings, and legal documents — powered by AI (Claude + FAISS semantic search) and deployed on Railway.

---

## 🖥️ Getting Started on Your Windows PC (Step-by-Step)

> **For Abbu** — follow these steps exactly, one by one. You only need to do the installation steps (1–3) once.

### Step 1 — Install Docker Desktop

1. Open your browser and go to: **https://www.docker.com/products/docker-desktop/**
2. Click **"Download for Windows"** and run the installer.
3. When asked, keep all default options and click **Next / Install**.
4. After installation, **restart your PC**.
5. After restart, open **Docker Desktop** from the Start Menu. Wait until you see the whale icon in the taskbar (bottom-right corner) turn steady (not animated). This means Docker is running.

### Step 2 — Download this Project

1. Go to: **https://github.com/Khan-Feroz211/Father-Gift**
2. Click the green **"Code"** button → then click **"Download ZIP"**.
3. Once downloaded, right-click the ZIP file → **"Extract All…"** → choose a folder (e.g., `C:\LegalPakistan`) → click **Extract**.

### Step 3 — Set Up the App (one time only)

1. Open the extracted folder (e.g., `C:\LegalPakistan\Father-Gift-main\legalpk`).
2. In the same folder, find the file called **`.env.example`**. Copy it and rename the copy to **`.env`** (no `.example` at the end).
3. Open `.env` with Notepad. You will see a line that says:
   ```
   ANTHROPIC_API_KEY=your_key_here
   ```
   Replace `your_key_here` with the API key Feroz gives you. Save and close.

### Step 4 — Start the App

1. In the `legalpk` folder, click on the address bar at the top of the folder window, type `cmd`, and press **Enter**. A black Command Prompt window will open.
2. Type the following command and press **Enter**:
   ```
   docker compose up --build
   ```
3. Wait — the first time this takes 5–10 minutes while it downloads everything. You will see lots of text scrolling. When it stops scrolling and shows messages like `Application startup complete`, the app is ready.

### Step 5 — Open the App in Your Browser

1. Open **any browser** (Chrome, Edge, Firefox).
2. Go to: **http://localhost:3001**
3. You will see the LegalPakistan login screen. Click **Register** to create your account the first time, then log in.

### Every Day After That

- Make sure **Docker Desktop** is running (whale icon in taskbar).
- Open Command Prompt in the `legalpk` folder and run:
  ```
  docker compose up
  ```
- Open **http://localhost:3001** in your browser.

### To Stop the App

In the Command Prompt window, press **Ctrl + C**, then type:
```
docker compose down
```

### Common Problems

| Problem | Solution |
|---|---|
| "Docker Desktop is not running" | Open Docker Desktop from Start Menu and wait for the whale icon to be steady |
| Page shows "Cannot connect" | Wait 1–2 more minutes for the app to finish starting, then refresh |
| Command says "port already in use" | Run `docker compose down` and then `docker compose up` again |
| Forgot password | Ask Feroz to reset it, or delete the database volume and re-register |

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
