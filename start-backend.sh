#!/usr/bin/env bash
# Run from project root: ./start-backend.sh
set -e
cd "$(dirname "$0")/backend"
exec python -m uvicorn app.main:app --reload --port 8000
