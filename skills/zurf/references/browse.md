# browse — Cloud Browser Rendering

Opens a URL in a cloud Chromium browser via Browserbase, waits for full JavaScript rendering, then returns the content as markdown (default) or HTML. Use this for JS-heavy pages, single-page applications, or pages where `fetch` returns incomplete content.

## Syntax

```bash
zurf browse <url> [flags]
```

## Arguments

- `url` (required) — the URL to browse.

## Flags

| Flag | Description | Default |
|---|---|---|
| `--html` | Return raw HTML instead of markdown. | off |
| `--json` | Print machine-readable JSON to stdout. | off |
| `-o, --output <file>` | Write full content to this file. | none |

## Workflow

Always dispatch `browse` to a sub-agent. Output contains full page content that will bloat the main context.

1. Dispatch a sub-agent with the prompt pattern below.
2. The sub-agent runs `zurf browse <url> --json`, extracts the requested information, and returns a concise summary.
3. Present the sub-agent's findings to the user.

## Sub-agent prompt pattern

```
Browse the URL {url} by running: zurf browse {url} --json

Then extract and return ONLY:
{specific information needed}

Do not return raw HTML. Return a concise summary of the requested information.
```

## When to use browse

Only use `browse` when `fetch` is not sufficient:
- Single-page applications (SPAs) that render content with JavaScript.
- Dynamic pages where content loads asynchronously.
- Pages where `fetch` returned incomplete or empty content.

For all other pages, prefer `fetch` — it is faster and lighter.

## Examples

```bash
zurf browse https://example.com
zurf browse https://example.com --html
zurf browse https://example.com --json
zurf browse https://example.com -o page.md
```
