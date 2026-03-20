# Deploying LegalPakistan to Railway

## Prerequisites

1. [Railway account](https://railway.app)
2. Railway CLI: `npm install -g @railway/cli`
3. `railway login`

---

## First-Time Setup

### 1. Create a Railway Project

```bash
cd legalpk
railway init
```

### 2. Add Databases

In the Railway dashboard, provision:
- **PostgreSQL** plugin → copy `DATABASE_URL` (change driver to `postgresql+asyncpg://`)
- **Redis** plugin → copy `REDIS_URL`

### 3. Set Environment Variables

In Railway → Project → Variables, add for each service:

```
ANTHROPIC_API_KEY=sk-ant-...
APP_SECRET_KEY=<random-64-char-string>
JWT_SECRET_KEY=<random-64-char-string>
DATABASE_URL=postgresql+asyncpg://...
REDIS_URL=redis://...
CELERY_BROKER_URL=redis://.../1
CELERY_RESULT_BACKEND=redis://.../2
ALLOWED_ORIGINS=https://your-frontend.railway.app
APP_ENV=production
DEBUG=false
LOG_LEVEL=WARNING
EMAILS_FROM=noreply@yourdomain.com
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your@gmail.com
SMTP_PASSWORD=your-app-password
```

### 4. Deploy Services

```bash
# Deploy backend
railway up --service legalpk-backend --detach

# Deploy worker
railway up --service legalpk-worker --detach

# Deploy scheduler
railway up --service legalpk-scheduler --detach

# Deploy frontend
railway up --service legalpk-frontend --detach
```

---

## Service Configuration

| Service | Port | Health Check |
|---|---|---|
| `legalpk-backend` | `$PORT` (auto) | `GET /health` |
| `legalpk-worker` | — | — |
| `legalpk-scheduler` | — | — |
| `legalpk-frontend` | `$PORT` (auto) | `GET /` |

The **frontend** is served on whatever port Railway assigns. Internally nginx listens on port 80. Railway handles TLS termination.

---

## Running Migrations on Railway

```bash
railway run --service legalpk-backend alembic upgrade head
```

---

## Frontend API URL

In the Railway frontend service variables:
```
VITE_API_URL=https://legalpk-backend.up.railway.app
```

Then rebuild the frontend service.

---

## Custom Domain

1. Railway dashboard → legalpk-frontend → Settings → Domains
2. Add your custom domain
3. Update `ALLOWED_ORIGINS` in the backend service to include `https://yourdomain.com`
4. Update `VITE_API_URL` in the frontend service

---

## Monitoring

- **Celery Flower**: Deploy as an additional Railway service with command `celery -A backend.app.workers.celery_app flower --port=$PORT`
- The frontend is accessible at: `https://legalpk-frontend.up.railway.app` (port handled by Railway)
- API docs: `https://legalpk-backend.up.railway.app/docs`

---

## Rollback

```bash
railway rollback --service legalpk-backend
```
