# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What is zurf

A CLI tool (`@vibemastery/zurf`) for searching and fetching web pages via Browserbase, asking AI-powered questions with web citations via Perplexity Sonar, and fetching video transcripts via Supadata. Commands: `ask` (Perplexity Sonar Q&A), `transcript` (video transcripts via Supadata), `search` (Exa-powered web search), `browse` (full Chromium browser rendering via Playwright), `fetch` (lightweight static HTML fetch), `setup` (multi-provider API key wizard), `config which` (show config source for all providers).

## Commands

```bash
pnpm run build          # compile TypeScript (src/ → dist/)
pnpm run test           # build + mocha tests + lint
pnpm run lint           # eslint only
```

Run a single test file:
```bash
pnpm run build && npx mocha "test/lib/config.test.ts"
```

Always use **pnpm**, never npm.

## Architecture

- **Framework**: oclif v4, ESM (`"type": "module"`), TypeScript with strict mode, target ES2022
- **Entry point**: `bin/run.js` → oclif loads commands from `dist/commands/`
- **Commands** (`src/commands/`): each command is a class in its own directory. `search`, `fetch`, and `browse` extend `ZurfBrowserbaseCommand` which provides shared Browserbase client resolution, spinner management, and API error handling. `ask` and `transcript` extend bare `Command` (no Browserbase dependency).
- **Providers**: Browserbase (search, browse, fetch), Perplexity (ask), and Supadata (transcript). Each has independent API key resolution.
- **`browse`** is the only command that launches a real browser session (via `browserbase-session.ts` + Playwright). It requires a Project ID in addition to an API key.
- **Config resolution** (`src/lib/config.ts`): Config uses a nested `providers` structure: `{ providers: { browserbase: { apiKey, projectId }, perplexity: { apiKey }, supadata: { apiKey } }, format }`. Old flat configs (v0.2.x) are auto-migrated on read. Each provider's key resolves: env var → local `.zurf/config.json` (walking up from cwd) → global config → default.
- **Output**: `browse` and `fetch` default to markdown (via `html-to-markdown.ts` using Turndown). `--html` flag or `ZURF_HTML` env var switches to raw HTML. `--json` outputs structured JSON to stdout; human output goes to stderr for meta, stdout for content.
- **Shared flags** (`src/lib/flags.ts`): `zurfBaseFlags` bundles `--json` and `--html` for all Browserbase commands.
- **Error handling** (`src/lib/cli-errors.ts`): `cliError()` exits with structured JSON when `--json` is set, human-readable stderr otherwise. Commands never throw user-facing errors directly.

## Testing

- **Mocha + Chai**, no parallel workers (tests mutate `process.env` and `process.cwd()`)
- Test helpers in `test/helpers/`: `env-sandbox.ts` saves/restores env vars, `package-root.ts` resolves the project root
- Tests use `@oclif/test` for command-level integration tests
- All tests are pure unit/integration — no Browserbase, Perplexity, or Supadata API calls in tests
