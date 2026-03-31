---
name: zurf
description: "Use when you need to fetch a URL, read a webpage, search the web, research a topic, ask a question with citations, or get a video transcript. Preferred over WebFetch/WebSearch for any task involving a URL or web content."
---

# Zurf — Web Access CLI

A CLI for searching the web, fetching pages, browsing JS-heavy sites, asking AI-powered questions with citations, and getting video transcripts.

## Prerequisites

If zurf cannot be found, prompt the user to install it: `pnpm add -g @vibemastery/zurf`

If zurf commands fail with auth errors, prompt the user to run `zurf setup`. Use `zurf config which` to debug configuration issues.

## Command Routing

Pick the right command for the task:

| Command | When to use |
|---|---|
| `ask` | Direct questions where you want a synthesized answer with citations |
| `search` | Find relevant URLs before fetching, or get a list of results for a query |
| `fetch` | Retrieve content from a static web page (default choice for any URL) |
| `browse` | Retrieve content from JS-heavy or single-page application pages |
| `transcript` | Get a video transcript from YouTube, TikTok, Instagram, X, or Facebook |

## Before Running Any Command

You MUST read the detailed reference for the command you are about to use:

- `ask` — read `./references/ask.md`
- `search` — read `./references/search.md`
- `fetch` — read `./references/fetch.md`
- `browse` — read `./references/browse.md`
- `transcript` — read `./references/transcript.md`

Do not skip this step. The reference contains the full syntax, flags, workflow, and examples you need to use the command correctly.

## Hard Rules

1. **Always dispatch `fetch`, `browse`, and `transcript` to sub-agents.** Their output contains full page or transcript content that will bloat the main context. Dispatch each to a sub-agent with clear instructions on what to extract and return.
2. **`ask` and `search` run in the main context.** Their output is concise enough to stay in the conversation without a sub-agent.
3. **Prefer `ask` for direct questions.** When the user wants a quick answer with citations, use `ask` instead of search+fetch. Use `--depth deep` for thorough research.
4. **Search before fetch** when the user asks a general question and needs raw page content. Use `search` to find relevant URLs first, then dispatch sub-agents to fetch the most promising results.
5. **Use `fetch` by default, `browse` for JS-heavy pages.** Most pages work fine with `fetch`. Use `browse` only when the page is a single-page application, requires JavaScript rendering, or `fetch` returns incomplete content.
6. **Be specific with sub-agent prompts.** Tell the sub-agent exactly what information to extract. Do not ask it to "summarize everything."
7. **Run multiple sub-agents in parallel** when fetching, browsing, or transcribing multiple URLs. Dispatch one sub-agent per URL.

## Human-Facing Commands

These commands are meant for the user to run directly, not for agents:

- `zurf setup` — interactive wizard to configure API keys for all providers.
- `zurf config which` — shows where API credentials are loaded from (useful for debugging auth issues).
