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
* [`zurf config which`](#zurf-config-which)
* [`zurf fetch URL`](#zurf-fetch-url)
* [`zurf help [COMMAND]`](#zurf-help-command)
* [`zurf init`](#zurf-init)
* [`zurf plugins`](#zurf-plugins)
* [`zurf plugins add PLUGIN`](#zurf-plugins-add-plugin)
* [`zurf plugins:inspect PLUGIN...`](#zurf-pluginsinspect-plugin)
* [`zurf plugins install PLUGIN`](#zurf-plugins-install-plugin)
* [`zurf plugins link PATH`](#zurf-plugins-link-path)
* [`zurf plugins remove [PLUGIN]`](#zurf-plugins-remove-plugin)
* [`zurf plugins reset`](#zurf-plugins-reset)
* [`zurf plugins uninstall [PLUGIN]`](#zurf-plugins-uninstall-plugin)
* [`zurf plugins unlink [PLUGIN]`](#zurf-plugins-unlink-plugin)
* [`zurf plugins update`](#zurf-plugins-update)
* [`zurf search QUERY`](#zurf-search-query)

## `zurf config which`

Show where the Browserbase API key would be loaded from (no secret printed)

```
USAGE
  $ zurf config which [-k <value>] [--json]

FLAGS
  -k, --api-key=<value>  Simulate passing --api-key on other commands
      --json             [env: ZURF_JSON] Print machine-readable JSON to stdout

DESCRIPTION
  Show where the Browserbase API key would be loaded from (no secret printed)

EXAMPLES
  $ zurf config which

  $ zurf config which --json
```

_See code: [src/commands/config/which.ts](https://github.com/vibemastery/zurf/blob/v0.1.0/src/commands/config/which.ts)_

## `zurf fetch URL`

Fetch a URL via Browserbase (no browser session; static HTML, 1 MB max)

```
USAGE
  $ zurf fetch URL [-k <value>] [--json] [--allow-insecure-ssl] [--allow-redirects] [-o <value>] [--proxies]

ARGUMENTS
  URL  URL to fetch

FLAGS
  -k, --api-key=<value>     Browserbase API key (overrides env and config files)
  -o, --output=<value>      Write response body to this file (full content); otherwise human mode prints a truncated
                            preview to stdout
      --allow-insecure-ssl  Disable TLS certificate verification (use only if you trust the target)
      --allow-redirects     Follow HTTP redirects
      --json                [env: ZURF_JSON] Print machine-readable JSON to stdout
      --proxies             Route through Browserbase proxies (helps with some blocked sites)

DESCRIPTION
  Fetch a URL via Browserbase (no browser session; static HTML, 1 MB max)

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

Save your Browserbase API key to global or project config

```
USAGE
  $ zurf init [-k <value>] [--json] [--gitignore] [--global | --local]

FLAGS
  -k, --api-key=<value>  API key (non-interactive); otherwise read from stdin pipe or prompt
      --gitignore        Append .zurf/ to ./.gitignore if that entry is missing
      --global           Store API key in user config (~/.config/zurf or XDG equivalent)
      --json             [env: ZURF_JSON] Print machine-readable JSON to stdout
      --local            Store API key in ./.zurf/config.json for this directory

DESCRIPTION
  Save your Browserbase API key to global or project config

EXAMPLES
  $ zurf init --global

  $ zurf init --local

  printenv BROWSERBASE_API_KEY | zurf init --global
```

_See code: [src/commands/init/index.ts](https://github.com/vibemastery/zurf/blob/v0.1.0/src/commands/init/index.ts)_

## `zurf plugins`

List installed plugins.

```
USAGE
  $ zurf plugins [--json] [--core]

FLAGS
  --core  Show core plugins.

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  List installed plugins.

EXAMPLES
  $ zurf plugins
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/5.4.59/src/commands/plugins/index.ts)_

## `zurf plugins add PLUGIN`

Installs a plugin into zurf.

```
USAGE
  $ zurf plugins add PLUGIN... [--json] [-f] [-h] [-s | -v]

ARGUMENTS
  PLUGIN...  Plugin to install.

FLAGS
  -f, --force    Force npm to fetch remote resources even if a local copy exists on disk.
  -h, --help     Show CLI help.
  -s, --silent   Silences npm output.
  -v, --verbose  Show verbose npm output.

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  Installs a plugin into zurf.

  Uses npm to install plugins.

  Installation of a user-installed plugin will override a core plugin.

  Use the ZURF_NPM_LOG_LEVEL environment variable to set the npm loglevel.
  Use the ZURF_NPM_REGISTRY environment variable to set the npm registry.

ALIASES
  $ zurf plugins add

EXAMPLES
  Install a plugin from npm registry.

    $ zurf plugins add myplugin

  Install a plugin from a github url.

    $ zurf plugins add https://github.com/someuser/someplugin

  Install a plugin from a github slug.

    $ zurf plugins add someuser/someplugin
```

## `zurf plugins:inspect PLUGIN...`

Displays installation properties of a plugin.

```
USAGE
  $ zurf plugins inspect PLUGIN...

ARGUMENTS
  PLUGIN...  [default: .] Plugin to inspect.

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  Displays installation properties of a plugin.

EXAMPLES
  $ zurf plugins inspect myplugin
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/5.4.59/src/commands/plugins/inspect.ts)_

## `zurf plugins install PLUGIN`

Installs a plugin into zurf.

```
USAGE
  $ zurf plugins install PLUGIN... [--json] [-f] [-h] [-s | -v]

ARGUMENTS
  PLUGIN...  Plugin to install.

FLAGS
  -f, --force    Force npm to fetch remote resources even if a local copy exists on disk.
  -h, --help     Show CLI help.
  -s, --silent   Silences npm output.
  -v, --verbose  Show verbose npm output.

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  Installs a plugin into zurf.

  Uses npm to install plugins.

  Installation of a user-installed plugin will override a core plugin.

  Use the ZURF_NPM_LOG_LEVEL environment variable to set the npm loglevel.
  Use the ZURF_NPM_REGISTRY environment variable to set the npm registry.

ALIASES
  $ zurf plugins add

EXAMPLES
  Install a plugin from npm registry.

    $ zurf plugins install myplugin

  Install a plugin from a github url.

    $ zurf plugins install https://github.com/someuser/someplugin

  Install a plugin from a github slug.

    $ zurf plugins install someuser/someplugin
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/5.4.59/src/commands/plugins/install.ts)_

## `zurf plugins link PATH`

Links a plugin into the CLI for development.

```
USAGE
  $ zurf plugins link PATH [-h] [--install] [-v]

ARGUMENTS
  PATH  [default: .] path to plugin

FLAGS
  -h, --help          Show CLI help.
  -v, --verbose
      --[no-]install  Install dependencies after linking the plugin.

DESCRIPTION
  Links a plugin into the CLI for development.

  Installation of a linked plugin will override a user-installed or core plugin.

  e.g. If you have a user-installed or core plugin that has a 'hello' command, installing a linked plugin with a 'hello'
  command will override the user-installed or core plugin implementation. This is useful for development work.


EXAMPLES
  $ zurf plugins link myplugin
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/5.4.59/src/commands/plugins/link.ts)_

## `zurf plugins remove [PLUGIN]`

Removes a plugin from the CLI.

```
USAGE
  $ zurf plugins remove [PLUGIN...] [-h] [-v]

ARGUMENTS
  [PLUGIN...]  plugin to uninstall

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Removes a plugin from the CLI.

ALIASES
  $ zurf plugins unlink
  $ zurf plugins remove

EXAMPLES
  $ zurf plugins remove myplugin
```

## `zurf plugins reset`

Remove all user-installed and linked plugins.

```
USAGE
  $ zurf plugins reset [--hard] [--reinstall]

FLAGS
  --hard       Delete node_modules and package manager related files in addition to uninstalling plugins.
  --reinstall  Reinstall all plugins after uninstalling.
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/5.4.59/src/commands/plugins/reset.ts)_

## `zurf plugins uninstall [PLUGIN]`

Removes a plugin from the CLI.

```
USAGE
  $ zurf plugins uninstall [PLUGIN...] [-h] [-v]

ARGUMENTS
  [PLUGIN...]  plugin to uninstall

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Removes a plugin from the CLI.

ALIASES
  $ zurf plugins unlink
  $ zurf plugins remove

EXAMPLES
  $ zurf plugins uninstall myplugin
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/5.4.59/src/commands/plugins/uninstall.ts)_

## `zurf plugins unlink [PLUGIN]`

Removes a plugin from the CLI.

```
USAGE
  $ zurf plugins unlink [PLUGIN...] [-h] [-v]

ARGUMENTS
  [PLUGIN...]  plugin to uninstall

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Removes a plugin from the CLI.

ALIASES
  $ zurf plugins unlink
  $ zurf plugins remove

EXAMPLES
  $ zurf plugins unlink myplugin
```

## `zurf plugins update`

Update installed plugins.

```
USAGE
  $ zurf plugins update [-h] [-v]

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Update installed plugins.
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/5.4.59/src/commands/plugins/update.ts)_

## `zurf search QUERY`

Search the web via Browserbase (Exa-powered)

```
USAGE
  $ zurf search QUERY [-k <value>] [--json] [-n <value>]

ARGUMENTS
  QUERY  Search query, max 200 characters (quote for multiple words)

FLAGS
  -k, --api-key=<value>      Browserbase API key (overrides env and config files)
  -n, --num-results=<value>  [default: 10] Number of results (1–25)
      --json                 [env: ZURF_JSON] Print machine-readable JSON to stdout

DESCRIPTION
  Search the web via Browserbase (Exa-powered)

EXAMPLES
  $ zurf search "browserbase documentation"

  $ zurf search "laravel inertia" --num-results 5 --json
```

_See code: [src/commands/search/index.ts](https://github.com/vibemastery/zurf/blob/v0.1.0/src/commands/search/index.ts)_
<!-- commandsstop -->
