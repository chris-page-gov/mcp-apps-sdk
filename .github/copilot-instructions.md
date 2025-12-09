# Copilot Instructions

## Environment Guardrails
- Always export `OPENAI_API_KEY` before touching the chatbot. The `pnpm example:chatbot` helper now calls `https://api.openai.com/v1/models/gpt-4o` up front and will abort on 401/403. Use `SKIP_OPENAI_KEY_CHECK=1` only when you intentionally want to bypass validation (for example, while offline).
- When the web UI shows a red banner such as `OPENAI_API_KEY is not configured`, stop and fix the underlying configuration instead of retrying requests—the guard will fire every time until the key is repaired.

## Recommended Workflow
- Use `pnpm example:chatbot` for the full stack; it builds widget assets, launches the MCP servers, and boots Next.js. Exit with `Ctrl+C` to tear everything down cleanly.
- Need a quick probe? `pnpm debug:chatbot "What tools are available?"` calls `/api/chat` and streams the raw SSE response so you can see backend errors immediately.
- Manual launches still work (widget server, MCP servers, Next.js dev), but always rebuild assets before serving and ensure ports 3000/4444/8000/8002 remain free.

## Documentation & Changelog Discipline
- Every code or tooling change must update `docs/CHANGELOG.md` the moment it lands. Capture what changed and why so future contributors aren’t guessing.
- Keep `docs/user-guide.md` in sync with workflow changes (scripts, flags, new servers) and update this instruction file whenever we learn a new gotcha.

## Testing Expectations
- Run `pnpm --filter example-chatbot type-check` and `pnpm --filter example-chatbot test` after modifying the chatbot API, UI, or scripts.
- For package-level work, rely on the package’s own `test`, `lint`, and `type-check` scripts via `pnpm --filter <package> <script>`.

## Communication
- Surface OpenAI quota or authentication issues in commit messages and PR descriptions so downstream teams know why the guard exists.
- When reporting issues, attach the exact error message (from the CLI banner or test client) and note whether the script’s preflight succeeded.
