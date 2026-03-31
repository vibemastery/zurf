# search — Web Search

Search the web via Browserbase (Exa-powered). Returns a list of URLs, titles, and snippets — not full page content.

## Syntax

```bash
zurf search "query" [flags]
```

## Arguments

- `query` (required) — search query, max 200 characters. Quote multi-word queries.

## Flags

| Flag | Description | Default |
|---|---|---|
| `--num-results, -n <number>` | Number of results to return (1-25). | `10` |
| `--json` | Print machine-readable JSON to stdout. | off |
| `--html` | Output raw HTML instead of markdown. | off |

## Workflow

Run `search` directly in the main context — results are small enough to stay in the conversation.

1. Run `zurf search "query" --json`.
2. Review the returned URLs, titles, and snippets.
3. Select the most relevant URLs.
4. Dispatch sub-agents in parallel to `zurf fetch` each URL with specific extraction instructions.
5. Synthesize findings from all sub-agents into a consolidated answer.

## Examples

```bash
zurf search "browserbase documentation"
zurf search "laravel inertia" --num-results 5 --json
```

## Edge cases

- Query is limited to 200 characters. If the user's question is longer, distill it into a concise search query.
