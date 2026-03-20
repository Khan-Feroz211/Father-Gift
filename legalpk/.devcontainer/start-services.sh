#!/usr/bin/env bash
# .devcontainer/start-services.sh
# Start all LegalPakistan services in the background
set -e

WORKSPACE="/workspace/legalpk"
cd "$WORKSPACE"

echo "============================================"
echo "  Starting LegalPakistan Services"
echo "============================================"

# Step 1: Kill any existing processes
echo "[1/6] Stopping any existing processes..."
pkill -f "uvicorn backend.app.main" 2>/dev/null || true
pkill -f "celery -A backend.app.workers" 2>/dev/null || true
pkill -f "vite" 2>/dev/null || true
sleep 1

# Step 2: Activate venv
echo "[2/6] Activating Python virtual environment..."
source backend/.venv/bin/activate

# Step 3: Source environment
echo "[3/6] Loading environment variables..."
set -a
source .env
set +a

# Step 4: Backend
echo "[4/6] Starting FastAPI backend (port 8000)..."
nohup uvicorn backend.app.main:app \
    --host 0.0.0.0 \
    --port 8000 \
    --reload \
    > /tmp/legalpk_backend.log 2>&1 &
echo "  Backend PID: $!"

# Step 5: Celery services
echo "[5/6] Starting Celery worker, beat, and flower..."
nohup celery -A backend.app.workers.celery_app worker \
    --concurrency=2 \
    --loglevel=info \
    > /tmp/legalpk_celery.log 2>&1 &
echo "  Celery Worker PID: $!"

nohup celery -A backend.app.workers.celery_app beat \
    --loglevel=info \
    > /tmp/legalpk_beat.log 2>&1 &
echo "  Celery Beat PID: $!"

nohup celery -A backend.app.workers.celery_app flower \
    --port=5555 \
    > /tmp/legalpk_flower.log 2>&1 &
echo "  Celery Flower PID: $!"

# Step 6: Frontend
echo "[6/6] Starting Vite frontend dev server (port 3001)..."
nohup bash -c "cd frontend && npm run dev -- --host 0.0.0.0 --port 3001" \
    > /tmp/legalpk_frontend.log 2>&1 &
echo "  Frontend PID: $!"

# Wait for backend to become ready
echo ""
echo "Waiting for services to start..."
MAX_TRIES=30
COUNT=0
until curl -sf http://localhost:8000/health > /dev/null 2>&1; do
    COUNT=$((COUNT + 1))
    if [ "$COUNT" -ge "$MAX_TRIES" ]; then
        echo "WARNING: Backend did not start in time. Check /tmp/legalpk_backend.log"
        break
    fi
    sleep 2
done

if [ "$COUNT" -lt "$MAX_TRIES" ]; then
    echo ""
    echo "============================================"
    echo "  All services started!"
    echo ""
    echo "  Frontend:    http://localhost:3001"
    echo "  Backend API: http://localhost:8000"
    echo "  API Docs:    http://localhost:8000/docs"
    echo "  Flower:      http://localhost:5555"
    echo ""
    echo "  Logs:"
    echo "    tail -f /tmp/legalpk_backend.log"
    echo "    tail -f /tmp/legalpk_frontend.log"
    echo "    tail -f /tmp/legalpk_celery.log"
    echo "============================================"
fi
