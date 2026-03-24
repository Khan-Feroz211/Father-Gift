#!/usr/bin/env bash
# .devcontainer/setup.sh
# One-time setup for LegalPakistan dev environment in Codespaces
set -e

WORKSPACE="/workspace/legalpk"
cd "$WORKSPACE"

echo "============================================"
echo "  LegalPakistan Dev Environment Setup"
echo "============================================"

# Step 1: System dependencies
echo "[1/8] Installing system packages..."
apt-get update -qq
apt-get install -y --no-install-recommends \
    libpq-dev \
    libgomp1 \
    build-essential \
    curl \
    git \
    > /dev/null 2>&1

# Step 2: Python virtual environment
echo "[2/8] Creating Python virtual environment..."
python -m venv backend/.venv
source backend/.venv/bin/activate

# Step 3: Python dependencies
echo "[3/8] Installing Python dependencies..."
pip install --upgrade pip -q
pip install -r backend/requirements.txt -q
pip install -r backend/requirements-dev.txt -q

# Step 4: Environment file
echo "[4/8] Creating .env from example..."
if [ ! -f ".env" ]; then
    cp .env.example .env
    # Override URLs for Codespaces (services running as Docker containers)
    sed -i 's|DATABASE_URL=.*|DATABASE_URL=postgresql+asyncpg://legalpk:legalpk@localhost:5432/legalpk|' .env
    sed -i 's|REDIS_URL=.*|REDIS_URL=redis://localhost:6379/0|' .env
    sed -i 's|CELERY_BROKER_URL=.*|CELERY_BROKER_URL=redis://localhost:6379/1|' .env
    sed -i 's|CELERY_RESULT_BACKEND=.*|CELERY_RESULT_BACKEND=redis://localhost:6379/2|' .env
    sed -i 's|ALLOWED_ORIGINS=.*|ALLOWED_ORIGINS=http://localhost:3001|' .env
    echo ".env created from .env.example"
else
    echo ".env already exists, skipping"
fi

# Step 5: Frontend dependencies
echo "[5/8] Installing Node.js frontend dependencies..."
cd frontend && npm install --silent && cd ..

# Step 6: Data directories
echo "[6/8] Creating data directories..."
mkdir -p backend/data/{faiss,uploads,generated}

# Step 7: Wait for PostgreSQL and run migrations
echo "[7/8] Waiting for PostgreSQL and running migrations..."
MAX_TRIES=30
COUNT=0
until python -c "
import asyncio, asyncpg
async def check():
    conn = await asyncpg.connect('postgresql://legalpk:legalpk@localhost:5432/legalpk')
    await conn.close()
asyncio.run(check())
" 2>/dev/null; do
    COUNT=$((COUNT + 1))
    if [ "$COUNT" -ge "$MAX_TRIES" ]; then
        echo "WARNING: PostgreSQL not ready after ${MAX_TRIES} attempts — skipping migration"
        break
    fi
    echo "  Waiting for PostgreSQL... ($COUNT/$MAX_TRIES)"
    sleep 2
done

if [ "$COUNT" -lt "$MAX_TRIES" ]; then
    echo "  PostgreSQL ready! Running alembic migrations..."
    python -m alembic -c backend/alembic.ini upgrade head || echo "WARNING: Migration failed (may need ANTHROPIC_API_KEY)"
fi

# Step 8: Pre-download sentence-transformers model
echo "[8/8] Pre-downloading sentence-transformers model..."
python -c "
from sentence_transformers import SentenceTransformer
model = SentenceTransformer('paraphrase-multilingual-MiniLM-L12-v2')
print('Model downloaded successfully')
" || echo "WARNING: Model download failed (will retry on first use)"

echo ""
echo "============================================"
echo "  Setup Complete!"
echo ""
echo "  Next steps:"
echo "  1. Edit .env and add your ANTHROPIC_API_KEY"
echo "  2. The start-services.sh script will run automatically"
echo "     or run: bash .devcontainer/start-services.sh"
echo ""
echo "  Ports:"
echo "    Frontend:    http://localhost:3001"
echo "    Backend API: http://localhost:8000"
echo "    API Docs:    http://localhost:8000/docs"
echo "    Flower:      http://localhost:5555"
echo "============================================"
