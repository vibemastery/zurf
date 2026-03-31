# ask — Perplexity Sonar Q&A

Ask a question and get an AI-powered answer with web citations via Perplexity Sonar.

## Syntax

```bash
zurf ask "question" [flags]
```

## Arguments

- `question` (required) — the question to ask Perplexity.

## Flags

| Flag | Description | Default |
|---|---|---|
| `--depth <quick\|deep>` | Search depth. `quick` uses Sonar, `deep` uses Sonar Pro (more thorough). | `quick` |
| `--recency <hour\|day\|week\|month\|year>` | Filter sources by recency. | none |
| `--domains <list>` | Restrict search to specific domains (comma-separated). | none |
| `--no-citations` | Hide the sources list after the answer. | citations shown |
| `--json` | Print machine-readable JSON to stdout. | off |

## Workflow

1. Run `zurf ask "question" --json`.
2. Present the answer and citations to the user.
3. If the answer needs deeper raw page content, follow up with the search+fetch workflow.

## Examples

```bash
zurf ask "What is Browserbase?"
zurf ask "latest tech news" --recency day
zurf ask "search reddit for best CLI tools" --domains reddit.com
zurf ask "explain quantum computing" --depth deep
zurf ask "What is Node.js?" --json
zurf ask "What is oclif?" --no-citations
```

## When to go deeper

If the user needs more detail than the synthesized answer provides — for example, full page content, code examples, or raw documentation — switch to the search+fetch workflow: use `zurf search` to find URLs, then dispatch sub-agents to `zurf fetch` the most relevant results.
