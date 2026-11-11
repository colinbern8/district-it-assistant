#!/usr/bin/env bash
# Start the FastAPI backend (port 8000) and the Next.js frontend (port 3000)
# together. Press Ctrl+C once to stop both.
#
# Usage, from the project root:   ./scripts/dev.sh
set -euo pipefail
cd "$(dirname "$0")/.."

if [ ! -x .venv/bin/python ]; then
  echo "Python environment not found. Run: bash .devcontainer/setup.sh" >&2
  exit 1
fi

# Stop both servers when this script exits (Ctrl+C included).
trap 'kill 0' EXIT

echo "Starting API on http://localhost:8000 (docs: http://localhost:8000/docs)"
APP_ENV="${APP_ENV:-development}" .venv/bin/python -m uvicorn backend.main:app \
  --reload --reload-dir backend --reload-dir knowledge_base --reload-include '*.json' \
  --port 8000 &

echo "Starting frontend on http://localhost:3000"
(cd frontend && npm run dev) &

wait
