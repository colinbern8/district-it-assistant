#!/usr/bin/env bash
# Installs everything the project needs. Codespaces runs this automatically
# when the codespace is created; you can also run it yourself, from the
# project root:   bash .devcontainer/setup.sh
set -euo pipefail
cd "$(dirname "$0")/.."

echo "==> Python packages (into .venv)"
python3 -m venv .venv
.venv/bin/pip install --quiet --upgrade pip
.venv/bin/pip install --quiet -r backend/requirements-dev.txt

echo "==> Node packages"
(cd frontend && npm ci --no-audit --no-fund)

if [ ! -f frontend/.env.local ]; then
  cp frontend/.env.example frontend/.env.local
  echo "==> Created frontend/.env.local from .env.example"
fi

echo "==> Done. Start both servers with: ./scripts/dev.sh"
