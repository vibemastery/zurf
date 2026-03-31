# transcript — Video Transcripts

Fetch a video transcript from YouTube, TikTok, Instagram, X, Facebook, or a public file URL via Supadata. Returns timestamped segments by default, or plain text with `--text`.

## Syntax

```bash
zurf transcript <url> [flags]
```

## Arguments

- `url` (required) — the video URL to get the transcript from.

## Flags

| Flag | Description | Default |
|---|---|---|
| `--lang <code>` | Preferred language (ISO 639-1 code, e.g. `en`, `es`, `fr`). | none |
| `--mode <native\|generate\|auto>` | Transcript mode. `native` = captions only, `generate` = AI transcription, `auto` = try native first. | `auto` |
| `--text` | Return plain text instead of timestamped segments. | off |
| `-o, --output <file>` | Write transcript to this file. | none |
| `--json` | Print machine-readable JSON to stdout. | off |

## Workflow

Always dispatch `transcript` to a sub-agent. Transcript output can be large and will bloat the main context.

1. Dispatch a sub-agent with the prompt pattern below.
2. The sub-agent runs `zurf transcript <url> --json`, extracts the requested information, and returns a concise summary.
3. Present the sub-agent's findings to the user.

## Sub-agent prompt pattern

```
Fetch the transcript for {url} by running: zurf transcript {url} --json

Then extract and return ONLY:
{specific information needed}

Do not return the full transcript. Return a concise summary of the requested information.
```

## Supported platforms

- YouTube
- TikTok
- Instagram
- X (Twitter)
- Facebook
- Public file URLs (direct links to video files)

## Examples

```bash
zurf transcript https://www.youtube.com/watch?v=dQw4w9WgXcQ
zurf transcript https://www.tiktok.com/@user/video/123 --text
zurf transcript https://www.youtube.com/watch?v=abc --lang en --mode native
zurf transcript https://www.youtube.com/watch?v=abc --output transcript.txt
zurf transcript https://www.youtube.com/watch?v=abc --json
```
