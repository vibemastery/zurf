zurf
=================

A CLI toolkit for AI agents to search the web, browse pages, fetch content, ask questions, and transcribe video — powered by Browserbase, Perplexity, and Supadata.


[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)
[![Version](https://img.shields.io/npm/v/@vibemastery/zurf.svg)](https://npmjs.org/package/@vibemastery/zurf)
[![Downloads/week](https://img.shields.io/npm/dw/@vibemastery/zurf.svg)](https://npmjs.org/package/@vibemastery/zurf)

## Installation

```sh-session
$ npm install -g @vibemastery/zurf
$ zurf setup                       # configure API keys (Browserbase, Perplexity, Supadata)
$ zurf --help
```

## Commands

### `zurf ask <question>`

Ask a question and get an AI-powered answer with web citations via Perplexity Sonar. Use `--depth deep` for more thorough research (sonar-pro).

```sh-session
$ zurf ask "What is Browserbase?"
$ zurf ask "latest tech news" --recency day
$ zurf ask "search reddit for best CLI tools" --domains reddit.com
$ zurf ask "explain quantum computing" --depth deep
$ zurf ask "What is Node.js?" --json
$ zurf ask "What is oclif?" --no-citations
```

| Flag | Description |
|------|-------------|
| `--depth <quick\|deep>` | Search depth: quick (sonar) or deep (sonar-pro). Default: quick |
| `--recency <hour\|day\|week\|month\|year>` | Filter sources by recency |
| `--domains <list>` | Restrict search to these domains (comma-separated) |
| `--no-citations` | Hide the sources list after the answer |
| `--json` | Print machine-readable JSON to stdout |

### `zurf transcript <url>`

Fetch a video transcript from YouTube, TikTok, Instagram, X, Facebook, or a public file URL via Supadata. Returns timestamped segments by default, or plain text with `--text`.

```sh-session
$ zurf transcript https://www.youtube.com/watch?v=dQw4w9WgXcQ
$ zurf transcript https://www.tiktok.com/@user/video/123 --text
$ zurf transcript https://www.youtube.com/watch?v=abc --lang en --mode native
$ zurf transcript https://www.youtube.com/watch?v=abc --output transcript.txt
$ zurf transcript https://www.youtube.com/watch?v=abc --json
```

| Flag | Description |
|------|-------------|
| `--lang <code>` | Preferred language (ISO 639-1 code) |
| `--mode <native\|generate\|auto>` | Transcript mode: native (captions only), generate (AI), auto (try native first). Default: auto |
| `--text` | Return plain text instead of timestamped segments |
| `-o, --output` | Write transcript to a file |
| `--json` | Print machine-readable JSON to stdout |

### `zurf search <query>`

Search the web via Browserbase (Exa-powered). Returns a list of matching URLs with titles and snippets.

```sh-session
$ zurf search "browserbase documentation"
$ zurf search "laravel inertia" --num-results 5 --json
```

| Flag | Description |
|------|-------------|
| `-n, --num-results` | Number of results, 1-25 (default: 10) |
| `--json` | Print machine-readable JSON to stdout |

### `zurf browse <url>`

Open a URL in a real cloud Chromium browser via Browserbase, wait for JavaScript to fully render, then return the page content as **markdown** (default) or raw HTML.

Best for JavaScript-heavy pages (SPAs, dashboards, pages behind client-side rendering).

```sh-session
$ zurf browse https://example.com              # markdown output
$ zurf browse https://example.com --html       # raw HTML output
$ zurf browse https://example.com -o page.md   # save full content to file
$ zurf browse https://example.com --json       # JSON with content + metadata
```

| Flag | Description |
|------|-------------|
| `--html` | Output raw HTML instead of markdown |
| `-o, --output` | Write full content to a file |
| `--json` | Print machine-readable JSON to stdout |

### `zurf fetch <url>`

Fetch a URL via Browserbase without launching a full browser session. Returns the content as **markdown** (default) or raw HTML. Fast and lightweight, but only works for static pages (no JavaScript rendering). 1 MB max.

```sh-session
$ zurf fetch https://example.com               # markdown output
$ zurf fetch https://example.com --html        # raw HTML output
$ zurf fetch https://example.com -o page.md    # save full content to file
$ zurf fetch https://example.com --proxies     # route through Browserbase proxies
$ zurf fetch https://example.com --json        # JSON with content + metadata
```

| Flag | Description |
|------|-------------|
| `--html` | Output raw HTML instead of markdown |
| `-o, --output` | Write full content to a file |
| `--proxies` | Route through Browserbase proxies |
| `--allow-redirects` | Follow HTTP redirects |
| `--allow-insecure-ssl` | Disable TLS certificate verification |
| `--json` | Print machine-readable JSON to stdout |

### `zurf setup`

Interactive wizard to configure API keys for all providers (Browserbase, Perplexity, Supadata). Stores keys in global or local config. Re-run to update or add providers.

```sh-session
$ zurf setup                # interactive wizard
$ zurf setup --global       # skip scope prompt, save to global config
$ zurf setup --local        # skip scope prompt, save to project .zurf/config.json
```

### `zurf config which`

Show where your API keys would be loaded from (nothing secret is printed). Shows resolution for Browserbase, Perplexity, and Supadata.

```sh-session
$ zurf config which
$ zurf config which --json
```

## Output format

`zurf browse` and `zurf fetch` return **markdown** by default — smaller and more useful for LLM agents. Pass `--html` (or set `ZURF_HTML=true`) to get raw HTML instead.

You can also set the default in `.zurf/config.json` or the global config:

```json
{ "format": "html" }
```

Format resolution (highest precedence first):

1. `--html` flag
2. `ZURF_HTML` environment variable (`true` or `1`)
3. Local `.zurf/config.json` `format` field
4. Global config `format` field
5. Default: `markdown`

## Configuration

### Config file structure (v0.3.0+)

```json
{
  "providers": {
    "browserbase": {
      "apiKey": "bb_...",
      "projectId": "proj_..."
    },
    "perplexity": {
      "apiKey": "pplx-..."
    },
    "supadata": {
      "apiKey": "sd_..."
    }
  },
  "format": "markdown"
}
```

Old flat configs (v0.2.x) are auto-migrated when read — no manual action needed.

### API key resolution

Each provider resolves its key independently (highest precedence first):

**Browserbase:**
1. Environment variable `BROWSERBASE_API_KEY`
2. Nearest `.zurf/config.json` → `providers.browserbase.apiKey`
3. Global config → `providers.browserbase.apiKey`

**Perplexity:**
1. Environment variable `PERPLEXITY_API_KEY`
2. Nearest `.zurf/config.json` → `providers.perplexity.apiKey`
3. Global config → `providers.perplexity.apiKey`

**Supadata:**
1. Environment variable `SUPADATA_API_KEY`
2. Nearest `.zurf/config.json` → `providers.supadata.apiKey`
3. Global config → `providers.supadata.apiKey`

Save keys interactively:

```sh-session
$ zurf setup
```

For project-local storage, add `.zurf/` to `.gitignore` so keys are never committed. `zurf setup --local` will offer to do this automatically.

**Security note:** Keys in `config.json` are stored as plaintext with file mode `0o600`. For shared machines or stricter setups, prefer environment variables from a secrets manager.

### Migration from v0.2.x

- Config files auto-migrate from the old flat shape (`{ "apiKey": "..." }`) to the new nested shape. No manual changes needed.
- `zurf init` has been replaced by `zurf setup`. The setup wizard supports multiple providers.

## Agent Skill

Zurf ships a [skills.sh](https://skills.sh/)-compatible skill that teaches AI coding agents (Claude Code, Codex, Cursor, etc.) how to use every command. Install it with:

```sh-session
$ npx skills add vibemastery/zurf
```

The skill uses progressive disclosure: agents load a lean routing file first, then read detailed per-command references only when needed — keeping context usage low.

## Claude Code and agents

Install `zurf` on your `PATH` and allow the agent to run shell commands. Use `--json` when you want structured output:

```sh-session
$ zurf search "browserbase fetch api" --json
$ zurf browse https://example.com --json
$ zurf fetch https://example.com --json
$ zurf ask "What is Browserbase?" --json
$ zurf transcript https://www.youtube.com/watch?v=abc --json
```

Content is returned as markdown by default, which keeps token counts low. Pass `--html` if the agent needs the raw DOM.
