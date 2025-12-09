#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd -- "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
EXAMPLES_DIR="${ROOT_DIR}/examples/openai-apps-sdk-examples"
CHATBOT_DIR="${ROOT_DIR}/examples/chatbot"
SOLAR_DIR="${EXAMPLES_DIR}/solar-system_server_python"

if [[ -z "${OPENAI_API_KEY:-}" ]]; then
  echo "[run-chatbot-dev] OPENAI_API_KEY is not set. Export it before running or add it to .env.local." >&2
  exit 1
fi

cleanup() {
  local exit_code=$?
  for pid in "${WIDGET_PID:-}" "${MCP_PID:-}"; do
    if [[ -n "${pid:-}" ]]; then
      if kill -0 "$pid" 2>/dev/null; then
        kill "$pid" 2>/dev/null || true
      fi
    fi
  done
  wait 2>/dev/null || true
  return $exit_code
}

trap 'cleanup' EXIT
trap 'exit 130' INT TERM

(
  cd "$EXAMPLES_DIR"
  pnpm install
  pnpm run build
)

(
  cd "$EXAMPLES_DIR"
  pnpm run serve
) &
WIDGET_PID=$!
echo "[run-chatbot-dev] Widget server started on port 4444 (PID ${WIDGET_PID})."

(
  cd "$SOLAR_DIR"
  python -m venv .venv
  source .venv/bin/activate
  pip install -r requirements.txt
  uvicorn main:app --port 8002
) &
MCP_PID=$!
echo "[run-chatbot-dev] MCP server started on port 8002 (PID ${MCP_PID})."

cd "$CHATBOT_DIR"
pnpm install
pnpm dev
