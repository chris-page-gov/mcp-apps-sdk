# Agent Guidelines

This repository uses multiple automation workflows (GitHub Copilot, GPT-5-Codex agents, local scripts). Follow the guidance below before making any changes.

## Scope Overview
- **Monorepo root** – Primary source for the MCP Apps SDK packages and the Next.js chatbot example.
- **Submodule** – `examples/openai-apps-sdk-examples` is an upstream dependency mirror. **Do not modify this directory from within this repo.** Update it only by syncing the submodule pointer.

## Environment Guardrails
- Export a valid `OPENAI_API_KEY` in your shell or `.env.local`. The `pnpm example:chatbot` script performs a live check against `https://api.openai.com/v1/models/gpt-4o` and will halt on 401/403.
- Use `SKIP_OPENAI_KEY_CHECK=1 pnpm example:chatbot` only for intentional offline or mock runs.
- Keep ports `3000`, `4444`, `8000`, and `8002` free before launching the demo stack.

## Preferred Workflows
1. Install dependencies with `pnpm install` at the repo root.
2. Run `pnpm example:chatbot` for the end-to-end experience (widget assets, MCP servers, Next.js).
3. Tear down with `Ctrl+C` in the terminal session that started the helper.
4. For targeted debugging use `pnpm debug:chatbot "<prompt>"` to hit `/api/chat` directly.

## Error Handling Signals
- The chatbot UI reports backend failures via a red banner. Fix the surfaced issue (for example, missing API key) instead of re-sending the same prompt.
- Command-line helpers echo OpenAI validation results (`200`, `401`, `403`, `429`)—resolve the root cause before re-running.

## Testing Matrix
- After editing chatbot API, UI, or scripts: `pnpm --filter example-chatbot type-check` and `pnpm --filter example-chatbot test`.
- For individual packages: `pnpm --filter <package> lint|test|type-check`.

## Documentation Discipline
- Every code or tooling change must immediately update `docs/CHANGELOG.md`.
- Keep `docs/user-guide.md` aligned with new scripts, flags, or workflows.
- Update `.github/copilot-instructions.md` when new guardrails are discovered so GitHub Copilot stays in sync.

## Submodule Policy
- Treat `examples/openai-apps-sdk-examples` as read-only. If changes are needed, submit them to the upstream repository and then update the submodule commit in this repo.

## Contact and Escalation
- Record OpenAI quota/authentication issues in commit messages or PR descriptions.
- When reporting bugs, capture exact terminal output (validation status, banner message) along with reproduction steps.
