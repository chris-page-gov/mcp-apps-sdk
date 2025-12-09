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

if [[ "${SKIP_OPENAI_KEY_CHECK:-0}" != "1" ]]; then
  if ! command -v curl >/dev/null 2>&1; then
    echo "[run-chatbot-dev] curl is not available; skipping OpenAI API validation." >&2
  else
    echo "[run-chatbot-dev] Validating OPENAI_API_KEY against OpenAI's API..."
    status="$(
      curl -s -o /dev/null -w '%{http_code}' \
        https://api.openai.com/v1/models/gpt-4o \
        -H "Authorization: Bearer ${OPENAI_API_KEY}" \
        -H 'Content-Type: application/json'
    )"

    case "${status}" in
      200)
        echo "[run-chatbot-dev] OpenAI API key accepted (status 200)."
        ;;
      401)
        echo "[run-chatbot-dev] OPENAI_API_KEY was rejected (401 Unauthorized). Double-check the secret or set SKIP_OPENAI_KEY_CHECK=1 to bypass." >&2
        exit 1
        ;;
      403)
        echo "[run-chatbot-dev] OPENAI_API_KEY lacks access to gpt-4o (403 Forbidden). The chatbot will fail until access is granted." >&2
        ;;
      429)
        echo "[run-chatbot-dev] OpenAI rate limited the validation request (429). Continuing, but initial responses may fail." >&2
        ;;
      *)
        echo "[run-chatbot-dev] Received unexpected status ${status} while validating OPENAI_API_KEY. Continuing anyway." >&2
        ;;
    esac
  fi
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
