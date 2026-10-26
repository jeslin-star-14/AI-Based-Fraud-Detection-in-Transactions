#!/usr/bin/env bash

# Multimodal Document Intelligence Launcher for macOS / Linux

echo "======================================================================"
echo "          VERITY MULTIMODAL DOCUMENT INTELLIGENCE"
echo "======================================================================"
echo ""
echo "Starting Backend API (Port 8000) and Frontend Dev Server (Port 5173)..."
echo ""

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# 1. Start FastAPI Backend
cd "$SCRIPT_DIR/backend"
python3 -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload &
BACKEND_PID=$!

# 2. Start Vite Frontend
cd "$SCRIPT_DIR/frontend"
npm run dev -- --host 0.0.0.0 --port 5173 &
FRONTEND_PID=$!

cleanup() {
    echo ""
    echo "Shutting down servers..."
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    exit 0
}

trap cleanup SIGINT SIGTERM

echo ""
echo "======================================================================"
echo " [SUCCESS] All systems active!"
echo " - Frontend Web UI:  http://localhost:5173"
echo " - Backend API:     http://localhost:8000"
echo " - API Swagger Docs: http://localhost:8000/docs"
echo "======================================================================"
echo "Press Ctrl+C to stop both servers."
echo ""

wait
