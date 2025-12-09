# Changelog

All notable changes to this repository will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]
### Added
- Guidance for running alternate MCP servers (Pizzaz Node & Python) in `docs/user-guide.md`.
- Root documentation folder to consolidate onboarding material and release notes.
- Chat UI surfaces backend misconfiguration errors (e.g. missing `OPENAI_API_KEY`) instead of leaving the user guessing.
- Top-level `AGENTS.md` summarizing guardrails for all automation workflows and flagging the read-only submodule.

### Changed
- Devcontainer forwards `OPENAI_API_KEY` and critical ports to simplify example startup.
- `scripts/run-chatbot-dev.sh` now validates the OpenAI credential before launching services to prevent fruitless retries; set `SKIP_OPENAI_KEY_CHECK=1` to bypass.

## [0.2.0] - 2024-11-05
### Added
- Umbrella package `@xalia/mcp-apps-sdk` exporting client, adapter, and widget APIs from a single entry point.
- `pnpm example:chatbot` helper script plus documentation for running the full demo stack locally.
- `pnpm debug:chatbot` script for issuing direct `/api/chat` requests during debugging.

### Fixed
- Ensured widget asset builds run before the solar-system MCP server starts, preventing missing-template crashes.

## [0.1.0] - 2024-09-18
### Added
- Initial public release of:
  - `@xalia/mcp-client` (MCP client lifecycle helpers and transport re-exports).
  - `@xalia/mcp-apps-widget` (React `AssistantAppEmbed` component and Node widget cache utilities).
  - `@xalia/mcp-apps-adapters` (Vercel AI SDK tool conversion pipeline).
- Next.js chatbot example demonstrating Vercel AI SDK integration with MCP tools.

### Changed
- Standardized package builds on `tsup` with TypeScript project references for shared configurations.
