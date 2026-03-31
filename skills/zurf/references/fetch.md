# fetch — Static Page Retrieval

Fast, lightweight retrieval of static web pages without launching a browser. Returns extracted page content as markdown (default) or HTML. Limited to 1 MB per page.

## Syntax

```bash
zurf fetch <url> [flags]
```

## Arguments

- `url` (required) — the URL to fetch.

## Flags

| Flag | Description | Default |
|---|---|---|
| `--html` | Return raw HTML instead of markdown. | off |
| `--json` | Print machine-readable JSON to stdout. | off |
| `-o, --output <file>` | Write full content to this file. | none |
| `--proxies` | Route through Browserbase proxies (helps with blocked sites). | off |
| `--allow-redirects` | Follow HTTP redirects. | off |
| `--allow-insecure-ssl` | Disable TLS certificate verification. | off |

## Workflow

Always dispatch `fetch` to a sub-agent. Output contains full page content that will bloat the main context.

1. Dispatch a sub-agent with the prompt pattern below.
2. The sub-agent runs `zurf fetch <url> --json`, extracts the requested information, and returns a concise summary.
3. Present the sub-agent's findings to the user.

## Sub-agent prompt pattern

```
Fetch the URL {url} by running: zurf fetch {url} --json

Then extract and return ONLY:
{specific information needed}

Do not return raw HTML. Return a concise summary of the requested information.
```

## When to use fetch vs browse

Use `fetch` by default — it is faster and lighter. Switch to `browse` only when:
- The page is a single-page application (SPA).
- The page requires JavaScript rendering to show content.
- `fetch` returns incomplete or empty content.

## Examples

```bash
zurf fetch https://example.com
zurf fetch https://example.com --html
zurf fetch https://example.com --json
zurf fetch https://example.com -o page.md --proxies
```
