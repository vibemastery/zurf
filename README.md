zurf
=================

A lightweight CLI for searching, browsing, and fetching web pages, powered by Browserbase.


[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)
[![Version](https://img.shields.io/npm/v/@vibemastery/zurf.svg)](https://npmjs.org/package/@vibemastery/zurf)
[![Downloads/week](https://img.shields.io/npm/dw/@vibemastery/zurf.svg)](https://npmjs.org/package/@vibemastery/zurf)

## Installation

```sh-session
$ npm install -g @vibemastery/zurf
$ zurf init --global          # save your Browserbase API key
$ zurf --help
```

## Commands

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

### `zurf init`

Save your Browserbase API key and optional Project ID to a config file.

```sh-session
$ zurf init --global                              # save to global config
$ zurf init --local                               # save to project .zurf/config.json
$ zurf init --local --gitignore                   # also append .zurf/ to .gitignore
$ zurf init --global --project-id <project-id>    # save project ID too
```

### `zurf config which`

Show where your API key and Project ID would be loaded from (nothing secret is printed).

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

API key resolution (highest precedence first):

1. Environment variable `BROWSERBASE_API_KEY`
2. Nearest `.zurf/config.json` when walking up from the current working directory
3. Global config: `$XDG_CONFIG_HOME/zurf/config.json` (or `~/.config/zurf/config.json`)

Save a key interactively:

```sh-session
$ zurf init --global
$ zurf init --local
```

For project-local storage, add `.zurf/` to `.gitignore` so the key is never committed. You can run `zurf init --local --gitignore` to append a `.zurf/` entry automatically.

**Security note:** Keys in `config.json` are stored as plaintext with file mode `0o600`. For shared machines or stricter setups, prefer `BROWSERBASE_API_KEY` from your environment or a secrets manager instead of `init`.

## Claude Code and agents

Install `zurf` on your `PATH` and allow the agent to run shell commands. Use `--json` when you want structured output:

```sh-session
$ zurf search "browserbase fetch api" --json
$ zurf browse https://example.com --json
$ zurf fetch https://example.com --json
```

Content is returned as markdown by default, which keeps token counts low. Pass `--html` if the agent needs the raw DOM.
