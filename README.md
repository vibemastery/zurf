zurf
=================

A lightweight CLI for searching and fetching web pages, powered by Browserbase.


[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)
[![Version](https://img.shields.io/npm/v/zurf.svg)](https://npmjs.org/package/zurf)
[![Downloads/week](https://img.shields.io/npm/dw/zurf.svg)](https://npmjs.org/package/zurf)

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

<!-- toc -->
* [Usage](#usage)
* [Commands](#commands)
<!-- tocstop -->
# Usage
<!-- usage -->
```sh-session
$ npm install -g zurf
$ zurf COMMAND
running command...
$ zurf (--version)
zurf/0.1.0 darwin-arm64 node-v22.22.2
$ zurf --help [COMMAND]
USAGE
  $ zurf COMMAND
...
```
<!-- usagestop -->
# Commands
<!-- commands -->
* [`zurf autocomplete [SHELL]`](#zurf-autocomplete-shell)
* [`zurf config which`](#zurf-config-which)
* [`zurf fetch URL`](#zurf-fetch-url)
* [`zurf help [COMMAND]`](#zurf-help-command)
* [`zurf init`](#zurf-init)
* [`zurf search QUERY`](#zurf-search-query)

## `zurf autocomplete [SHELL]`

Display autocomplete installation instructions.

```
USAGE
  $ zurf autocomplete [SHELL] [-r]

ARGUMENTS
  [SHELL]  (zsh|bash|powershell) Shell type

FLAGS
  -r, --refresh-cache  Refresh cache (ignores displaying instructions)

DESCRIPTION
  Display autocomplete installation instructions.

EXAMPLES
  $ zurf autocomplete

  $ zurf autocomplete bash

  $ zurf autocomplete zsh

  $ zurf autocomplete powershell

  $ zurf autocomplete --refresh-cache
```

_See code: [@oclif/plugin-autocomplete](https://github.com/oclif/plugin-autocomplete/blob/v3.2.42/src/commands/autocomplete/index.ts)_

## `zurf config which`

Show where the API key is loaded from

```
USAGE
  $ zurf config which [--json]

FLAGS
  --json  [env: ZURF_JSON] Print machine-readable JSON to stdout

DESCRIPTION
  Show where the API key is loaded from

  Show where the Browserbase API key would be loaded from (no secret printed).
  Resolution order: BROWSERBASE_API_KEY, then project .zurf/config.json (walk-up), then global config in the CLI config directory.

EXAMPLES
  $ zurf config which

  $ zurf config which --json
```

_See code: [src/commands/config/which.ts](https://github.com/vibemastery/zurf/blob/v0.1.0/src/commands/config/which.ts)_

## `zurf fetch URL`

Fetch a URL via Browserbase

```
USAGE
  $ zurf fetch URL [--json] [--allow-insecure-ssl] [--allow-redirects] [-o <value>] [--proxies]

ARGUMENTS
  URL  URL to fetch

FLAGS
  -o, --output=<value>      Write response body to this file (full content); otherwise human mode prints a truncated preview to stdout
      --allow-insecure-ssl  Disable TLS certificate verification (use only if you trust the target)
      --allow-redirects     Follow HTTP redirects
      --json                [env: ZURF_JSON] Print machine-readable JSON to stdout
      --proxies             Route through Browserbase proxies (helps with some blocked sites)

DESCRIPTION
  Fetch a URL via Browserbase

  Fetch a URL via Browserbase (no browser session; static HTML, 1 MB max).
  Requires authentication. Run `zurf init --global` or use a project key before first use.

EXAMPLES
  $ zurf fetch https://example.com

  $ zurf fetch https://example.com --json

  $ zurf fetch https://example.com -o page.html --proxies
```

_See code: [src/commands/fetch/index.ts](https://github.com/vibemastery/zurf/blob/v0.1.0/src/commands/fetch/index.ts)_

## `zurf help [COMMAND]`

Display help for zurf.

```
USAGE
  $ zurf help [COMMAND...] [-n]

ARGUMENTS
  [COMMAND...]  Command to show help for.

FLAGS
  -n, --nested-commands  Include all nested commands in the output.

DESCRIPTION
  Display help for zurf.
```

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/6.2.40/src/commands/help.ts)_

## `zurf init`

Configure Browserbase API key storage

```
USAGE
  $ zurf init [--json] [--api-key <value>] [--gitignore] [--global] [--local]

FLAGS
  --api-key=<value>  API key for non-interactive use. Prefer piping stdin or using a TTY prompt — values on the command line are visible in shell history and process listings.
  --gitignore        Append .zurf/ to ./.gitignore if that entry is missing
  --global           Store API key in user config (oclif config dir for this CLI)
  --json             [env: ZURF_JSON] Print machine-readable JSON to stdout
  --local            Store API key in ./.zurf/config.json for this directory

DESCRIPTION
  Configure Browserbase API key storage

  Save your Browserbase API key to global or project config.
  Global path follows oclif config (same as `zurf config which`).

EXAMPLES
  $ zurf init --global

  $ zurf init --local

  printenv BROWSERBASE_API_KEY | zurf init --global
```

_See code: [src/commands/init/index.ts](https://github.com/vibemastery/zurf/blob/v0.1.0/src/commands/init/index.ts)_

## `zurf search QUERY`

Search the web via Browserbase

```
USAGE
  $ zurf search QUERY [--json] [-n <value>]

ARGUMENTS
  QUERY  Search query, max 200 characters (quote for multiple words)

FLAGS
  -n, --num-results=<value>  [default: 10] Number of results (1–25)
      --json                 [env: ZURF_JSON] Print machine-readable JSON to stdout

DESCRIPTION
  Search the web via Browserbase

  Search the web via Browserbase (Exa-powered).
  Requires authentication. Run `zurf init --global` or use a project key before first use.

EXAMPLES
  $ zurf search "browserbase documentation"

  $ zurf search "laravel inertia" --num-results 5 --json
```

_See code: [src/commands/search/index.ts](https://github.com/vibemastery/zurf/blob/v0.1.0/src/commands/search/index.ts)_
<!-- commandsstop -->
