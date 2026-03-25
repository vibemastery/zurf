zurf
=================

A lightweight CLI for searching and fetching web pages, powered by Browserbase.


[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)
[![Version](https://img.shields.io/npm/v/@vibemastery/zurf.svg)](https://npmjs.org/package/@vibemastery/zurf)
[![Downloads/week](https://img.shields.io/npm/dw/@vibemastery/zurf.svg)](https://npmjs.org/package/@vibemastery/zurf)

## Configuration

API key resolution for `zurf search` and `zurf fetch` (highest precedence first):

1. `--api-key` / `-k` on the command
2. Environment variable `BROWSERBASE_API_KEY`
3. Nearest `.zurf/config.json` when walking up from the current working directory
4. Global file: `$XDG_CONFIG_HOME/zurf/config.json` if `XDG_CONFIG_HOME` is set, otherwise `~/.config/zurf/config.json` (on Windows, `%APPDATA%\zurf\config.json`)

Save a key interactively or with `--api-key`:

```sh-session
$ zurf init --global
$ zurf init --local
```

For project-local storage, add `.zurf/` to `.gitignore` so the key is never committed. You can run `zurf init --local --gitignore` to append a `.zurf/` entry automatically.

**Security note:** Keys in `config.json` are stored as plaintext with file mode `0o600`. For shared machines or stricter setups, prefer `BROWSERBASE_API_KEY` from your environment or a secrets manager instead of `init`.

See where a key would be loaded from (nothing secret is printed): `zurf config which`.

## Claude Code and agents

Install `zurf` on your `PATH` and allow the agent to run shell commands. Use `--json` when you want a single JSON object on stdout, for example:

```sh-session
$ zurf search "browserbase fetch api" --json
$ zurf fetch https://example.com --json
```

## Installation

```sh-session
$ npm install -g @vibemastery/zurf
$ zurf --help
```
