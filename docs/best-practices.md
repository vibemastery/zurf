# Best Practices for Building CLIs with oclif

## Overview

oclif (Open CLI Framework) is a Node.js framework built by Heroku/Salesforce for constructing command-line interfaces ranging from simple single-command tools to large, plugin-driven ecosystems like the Heroku CLI and Salesforce CLI. It provides scaffolding, flag parsing, help generation, plugin architecture, and testing utilities out of the box — reducing boilerplate so you focus on command logic. The following rules and principles are derived from official oclif documentation and battle-tested patterns from real production CLIs.[1][2][3][4]

***

## 1. Project Structure

### Always Use the Generator to Scaffold

Never start an oclif project by hand. Run `oclif generate` to produce a fully wired project with `bin/run.js`, `bin/dev.js`, a `src/commands/` directory, `package.json` oclif config, and scaffolded tests. This ensures you start on a standard, supported foundation that tools like `@oclif/test` and `oclif manifest` expect.[5][1]

```bash
oclif generate mynewcli
cd mynewcli
./bin/dev.js hello world   # development mode
./bin/run.js hello world   # production mode
```

### One File = One Command

Place each command in its own file under `src/commands/`. File path maps directly to command ID: `src/commands/db/migrate.ts` becomes `mycli db:migrate`. Keep command files thin — delegate business logic to service modules outside `src/commands/`.[6]

### Choose the Right CLI Type Up Front

| CLI type | When to use | `package.json` strategy |
|---|---|---|
| `single` | One command, like `ls` or `cat` | `"strategy": "single"` |
| `pattern` (default) | Multiple commands in a directory | `"strategy": "pattern"` (default) |
| `explicit` | Controlled command list exported from an index | `"strategy": "explicit"` |

[6]

***

## 2. Command Design

### Every Command Must Have `description`, `summary`, and `examples`

oclif auto-generates help and README content from static properties. Skipping them degrades the user experience and documentation.[7][8]

```typescript
export class DeployCommand extends Command {
  static summary = 'Deploy the application to a target environment.'
  static description = `
Deploys the current build artifact to the specified environment.
Requires authentication. Run \`mycli auth login\` first.
  `
  static examples = [
    '<%= config.bin %> <%= command.id %> --env production',
    {
      description: 'Deploy to staging with verbose output',
      command: '<%= config.bin %> <%= command.id %> --env staging --verbose',
    },
  ]
}
```

Use `<%= config.bin %>` and `<%= command.id %>` template variables in examples so they stay accurate across renames.[7]

### Always `await` Promises Inside `run()`

oclif terminates the Node process 10 seconds after `Command.run` resolves. Any unawaited promise will likely be killed mid-execution.[7]

```typescript
// ❌ BAD — will be killed before completion
async run() {
  fetchData().then(data => this.log(data))
}

// ✅ GOOD — awaited, so it completes before shutdown
async run() {
  const data = await fetchData()
  this.log(data)
}
```

### Never Use `console.log` — Use `this.log`

`this.log` writes to stdout non-blocking and is automatically suppressed when the `--json` flag is present. `console.log` is blocking and bypasses JSON suppression.[8]

***

## 3. Flags and Arguments

### Use Typed Flags — Never Raw Strings

oclif provides `Flags.string()`, `Flags.boolean()`, `Flags.integer()`, `Flags.url()`, `Flags.option()`, and `Flags.custom<T>()`. Leverage TypeScript inference to keep flags strongly typed.[9][1]

```typescript
static flags = {
  env: Flags.option({
    char: 'e',
    options: ['production', 'staging', 'development'] as const,
    description: 'Target environment',
    required: true,
  })(),
  verbose: Flags.boolean({ char: 'v', default: false }),
  timeout: Flags.integer({ default: 30, description: 'Timeout in seconds' }),
}
```

### Prefer `--long-flag` Over Positional Args for Optional Input

Flags are self-documenting and order-independent. Reserve positional args for the primary, required input (e.g., a filename or resource name). Avoid requiring more than 2 positional args in a single command.[10][11]

### Declare Flag Relationships Explicitly

Use `dependsOn`, `exclusive`, `exactlyOne`, and `relationships` to enforce valid combinations at parse time — not inside `run()` with manual checks:[9]

```typescript
static flags = {
  output: Flags.string({ dependsOn: ['format'] }),
  format: Flags.option({ options: ['json', 'csv'] as const })(),
  quiet: Flags.boolean({ exclusive: ['verbose'] }),
}
```

### Support Environment Variables for CI/CD Friendliness

Set `env` on any flag that users might need to provide non-interactively in pipelines:[9]

```typescript
token: Flags.string({ env: 'MY_CLI_TOKEN', required: true })
```

### Create Custom Flags for Reusable Domain Types

For large CLIs, extract domain-specific flags into `src/flags.ts`. This avoids duplication and centralizes validation logic:[9]

```typescript
// src/flags.ts
export const salesforceId = Flags.custom<string>({
  description: 'A valid Salesforce record ID',
  parse: async (input) => {
    if (!/^[a-zA-Z0-9]{15,18}$/.test(input)) throw new Error('Invalid ID')
    return input
  },
})
```

***

## 4. Custom Base Class

### Always Build a `BaseCommand` for Non-Trivial CLIs

A shared base class is the single most impactful structural decision for a multi-command CLI. It centralizes: global flags (e.g., `--log-level`), `init()` setup (auth, config loading), shared `catch()` error handling, and utilities accessible from every command.[12][13]

```typescript
// src/baseCommand.ts
import { Command, Flags, Interfaces } from '@oclif/core'

type Flags<T extends typeof Command> = Interfaces.InferredFlags<
  typeof BaseCommand['baseFlags'] & T['flags']
>

export abstract class BaseCommand<T extends typeof Command> extends Command {
  static baseFlags = {
    'log-level': Flags.option({
      default: 'info',
      helpGroup: 'GLOBAL',
      options: ['debug', 'warn', 'error', 'info', 'trace'] as const,
      summary: 'Specify level for logging.',
    })(),
  }

  protected flags!: Flags<T>

  public async init(): Promise<void> {
    await super.init()
    const { flags } = await this.parse({
      flags: this.ctor.flags,
      baseFlags: (super.ctor as typeof BaseCommand).baseFlags,
      enableJsonFlag: this.ctor.enableJsonFlag,
      args: this.ctor.args,
      strict: this.ctor.strict,
    })
    this.flags = flags as Flags<T>
  }

  protected async catch(err: Error & { exitCode?: number }) {
    return super.catch(err)
  }

  protected async finally(_: Error | undefined) {
    return super.finally(_)
  }
}
```



### Use `baseFlags` for Global Flags (Not `flags`)

Flags defined in `baseFlags` on the base class are inherited by all subcommands and shown in a dedicated `GLOBAL FLAGS` group in help output — keeping help readable without polluting each command's own flag list.[13]

***

## 5. Error Handling

### Use `this.error()` With All Available Options

Always provide an `exit` code, a `code` string, and `suggestions` when calling `this.error()`. This enables programmatic handling in tests and gives users actionable guidance:[14][7]

```typescript
this.error('Authentication token expired.', {
  exit: 1,
  code: 'AUTH_TOKEN_EXPIRED',
  suggestions: ['Run `mycli auth login` to re-authenticate.'],
  ref: 'https://docs.mycli.io/auth',
})
```

### Centralize Cross-Cutting Error Handling in `BaseCommand.catch()`

Per-command `catch()` overrides are appropriate for command-specific edge cases. For global concerns (logging errors to a service, consistent formatting), override `catch()` in `BaseCommand`:[14]

```typescript
protected async catch(err: Error & { exitCode?: number }) {
  if (err.exitCode !== 0) {
    await reportToErrorService(err)
  }
  return super.catch(err)
}
```

### Customize `bin/run.js` for Global Error Handling

Replace the default `execute()` with oclif's lower-level `run/handle/flush` functions to insert custom logic before the process exits:[14]

```typescript
// bin/run.js
import { run, handle, flush } from '@oclif/core'

await run(process.argv.slice(2), import.meta.url)
  .catch(async (error) => {
    // custom pre-exit logic here
    return handle(error)
  })
  .finally(async () => flush())
```

***

## 6. JSON Output

### Enable `--json` on All Data-Returning Commands

Set `static enableJsonFlag = true` on commands that produce structured output. oclif will suppress all `this.log` calls automatically and print the `run()` return value as JSON — enabling scriptable, pipe-friendly CLIs:[15]

```typescript
export class ListUsersCommand extends Command {
  static enableJsonFlag = true

  async run(): Promise<{ users: User[] }> {
    const users = await api.getUsers()
    this.log(renderTable(users))    // suppressed when --json is used
    return { users }                // printed as JSON when --json is used
  }
}
```

### Never Use `console.log` When `enableJsonFlag` Is Active

`console.log` bypasses oclif's log suppression mechanism. Always use `this.log`, `this.warn`, and `this.error` so JSON mode works correctly.[8]

***

## 7. User Experience

### Use `ux.action` for Long-Running Operations

Wrap async work in `ux.action.start()` / `ux.action.stop()` to show a spinner. This degrades gracefully in non-TTY environments (CI, pipes) without breaking output:[16]

```typescript
import { ux } from '@oclif/core'

ux.action.start('Deploying to production')
await deploy()
ux.action.stop('done ✓')
```

For multi-step workflows, prefer the `listr` library over manual spinners.[16]

### Use Recommended Libraries for Rich Interactions

The `ux` module in `@oclif/core` is intentionally minimal. Reach for these well-maintained libraries for richer experiences:[17][18]

| Need | Library |
|---|---|
| Interactive prompts | `@inquirer/prompts` |
| Spinners | `ora` |
| Progress bars | `cli-progress` |
| Tables | `tty-table`, `cliui` |
| Colored JSON output | `color-json` |
| Inline terminal links | `terminal-link` |
| React-like CLI UI | `ink` |
| Notifications | `node-notifier` |

### Enable Flexible Taxonomy for Large CLIs

With many commands, users will inevitably enter commands in the wrong order. Enable `flexibleTaxonomy` in `package.json` so oclif auto-corrects ordering and fires a `command_incomplete` hook to prompt users interactively:[19][6]

```json
{
  "oclif": {
    "flexibleTaxonomy": true,
    "hooks": {
      "command_incomplete": "./dist/hooks/command_incomplete.js"
    }
  }
}
```

***

## 8. Plugins and Hooks

### Structure Large CLIs as Plugins From the Start

Break CLIs into plugins to enable: lazy loading for fast startup, sharing commands between multiple CLIs, and user-installable extensions. The plugin architecture is what makes the Heroku and Salesforce CLIs extensible at scale.[20][21]

### Include Essential Ecosystem Plugins

These first-party plugins should be considered standard for any production CLI:[21]

| Plugin | Purpose |
|---|---|
| `@oclif/plugin-help` | Renders `--help` output |
| `@oclif/plugin-not-found` | Shows "did you mean?" on typos |
| `@oclif/plugin-warn-if-update-available` | Notifies users of new versions |
| `@oclif/plugin-autocomplete` | Adds bash/zsh/fish tab completion |
| `@oclif/plugin-update` | Enables self-update functionality |
| `@oclif/plugin-plugins` | Lets end users install their own plugins |

### Use Hooks for Cross-Cutting Lifecycle Logic

oclif lifecycle hooks (`init`, `prerun`, `postrun`, `command_not_found`) are the correct place for global concerns like analytics, telemetry, auth token refresh, and update checks — not inside individual commands:[22]

```typescript
// src/hooks/init/analytics.ts
export default async function() {
  await trackCliStart()
}
```

Declare hooks in `package.json`:
```json
{
  "oclif": {
    "hooks": {
      "init": "./dist/hooks/init/analytics"
    }
  }
}
```

***

## 9. Testing

### Use `runCommand` from `@oclif/test` — Not Direct Function Calls

`runCommand` gives you `stdout`, `stderr`, and `error` properties for clean assertions without manual stream mocking:[23]

```typescript
import { runCommand } from '@oclif/test'
import { expect } from 'chai'

describe('deploy', () => {
  it('exits 1 on auth failure', async () => {
    const { error } = await runCommand('deploy --env production')
    expect(error?.oclif?.exit).to.equal(1)
    expect(error?.code).to.equal('AUTH_TOKEN_EXPIRED')
  })
})
```

### Mock External Dependencies With `nock`

Use `nock` to intercept HTTP requests rather than spinning up real servers in tests. This keeps tests fast, deterministic, and offline-runnable.[23]

### Test Both Success and Error Paths for Every Command

Do not only test the happy path. Every command with an error branch (API failure, missing auth, invalid input) needs a corresponding test that validates the `exit` code and `error.code`.[23][14]

### Configure Vitest With `disableConsoleIntercept: true`

If using Vitest instead of Mocha, Vitest intercepts console methods by default, which breaks `@oclif/test`'s stdout/stderr capture. Disable this in `vitest.config.ts`:[23]

```typescript
export default defineConfig({
  test: {
    disableConsoleIntercept: true,
  },
})
```

***

## 10. TypeScript and Code Quality

### Use TypeScript — It Is the Official Standard

oclif's generator produces TypeScript by default and the framework itself is TypeScript-first. TypeScript provides autocomplete on command properties, caught type errors in flag parsing, and the `oclif generate` command produces `.ts` files.[3][1]

### Use ESM for New Projects

oclif v4+ has full ESM support with CommonJS interoperability. New projects should select ESM at generation time. This aligns with the Node.js ecosystem direction and enables top-level `await`.[1][9]

### Run `oclif manifest` in CI to Keep the Manifest Current

The `oclif.manifest.json` file is used for command discovery and help generation. Regenerate it as part of your build process or CI pipeline to catch any drift.[2]

***

## 11. Performance

### Lazy-Load Heavy Dependencies

oclif adds ~85-135ms of startup overhead. The single biggest optimization is dynamic `import()` inside `run()` rather than top-level imports. This prevents unused dependencies from loading when users run unrelated commands:

```typescript
// ❌ BAD — loads at startup even if this command isn't invoked
import { S3Client } from '@aws-sdk/client-s3'

export class UploadCommand extends Command {
  async run() {
    const client = new S3Client({})
  }
}

// ✅ GOOD — loads only when this command actually runs
export class UploadCommand extends Command {
  async run() {
    const { S3Client } = await import('@aws-sdk/client-s3')
    const client = new S3Client({})
  }
}
```

### Handle `--version` and `--help` Before Loading Anything

These are the most common invocations and should return instantly. Ensure your hooks and init logic short-circuit when these flags are detected.

### Use the Built-in Performance Profiler

Enable with `settings.performanceEnabled = true` or `Config.load({enablePerf: true})`. View metrics via `DEBUG=oclif:perf`. It tracks: process uptime, config load time, individual plugin load times, hook execution times, and command load/run times.

### Reduce Dependency Count

Replace heavy npm packages with Node.js built-ins where possible. `@oclif/core` is ~12 MB with 30+ dependencies — minimize what you add on top. For npm-based distribution, install size directly impacts user experience.

### Cache Expensive Computations Between Runs

Use `this.config.cacheDir` to persist results of expensive operations (API responses, file system scans, config parsing) with TTL-based invalidation. This is especially impactful for commands that run frequently in tight loops.

***

## 12. Configuration Management

### Use oclif's Platform-Aware Directories

oclif provides platform-aware paths through `this.config`. Never hardcode `~/.mycli` — use these instead:

```typescript
this.config.configDir  // persistent user settings (~/.config/mycli on Linux, ~/Library/... on macOS)
this.config.cacheDir   // cache directory
this.config.dataDir    // data directory
```

All directories follow platform conventions (XDG on Linux, Library on macOS, AppData on Windows).

### Follow the Configuration Precedence Convention

For any configurable value, resolve in this order: **flags > environment variables > project config > user config > system config**. This aligns with user expectations and ensures CI/CD pipelines can override any default.

### Leverage Auto-Generated Scoped Environment Variables

oclif auto-generates environment variables scoped to your CLI name: `<CLI_NAME>_DEBUG`, `<CLI_NAME>_CACHE_DIR`, `<CLI_NAME>_CONFIG_DIR`, `<CLI_NAME>_DATA_DIR`. Document these for your users.

### Protect Sensitive Defaults From the Manifest

Use `noCacheDefault: true` on flags with sensitive default values to prevent them from being written to `oclif.manifest.json`. Use `defaultHelp` to display a human-readable placeholder in help text without exposing the actual value:

```typescript
static flags = {
  token: Flags.string({
    env: 'MY_CLI_TOKEN',
    noCacheDefault: true,
    defaultHelp: '<read from MY_CLI_TOKEN>',
  }),
}
```

***

## 13. Distribution and Packaging

### Choose the Right Distribution Channel

| Method | Command | Best For |
|---|---|---|
| npm | `npm publish` | Simplest; users run `npm install -g mycli` or `npx mycli` |
| Standalone tarballs | `oclif pack tarballs` | Bundles Node.js; no runtime dependency for users |
| macOS installer | `oclif pack macos` | `.pkg` file; supports code signing |
| Windows installer | `oclif pack win` | Requires 7zip + nsis; supports signing |
| Debian packages | `oclif pack deb` | Ubuntu/Debian distribution |

For open-source developer tools, npm is usually sufficient. For enterprise or non-developer audiences, standalone tarballs or platform installers eliminate the Node.js prerequisite.

### Enable Auto-Update for Non-npm Distribution

Add `@oclif/plugin-update` and host tarballs on S3 (or any static file host). Configure the host in `package.json`:

```json
{
  "oclif": {
    "update": {
      "s3": {
        "host": "https://mycli-releases.s3.amazonaws.com"
      }
    }
  }
}
```

The upload pipeline: `oclif pack tarballs` -> `oclif upload tarballs` -> `oclif promote` (move between channels).

### Use Release Channels for Pre-Release Versions

Create beta/dev/stable channels using the version format: `1.0.0-beta`. Users switch channels via `mycli update beta`. This enables early adopter testing without risking the stable install base.

***

## 14. Security

### Never Accept Secrets Via Flags

Flags leak into process tables (`ps aux`) and shell history. Always use environment variables or credential files for tokens, passwords, and API keys:

```typescript
// ❌ BAD — leaks to process table and shell history
static flags = {
  token: Flags.string({ required: true }),
}

// ✅ GOOD — reads from environment or credential file
static flags = {
  token: Flags.string({ env: 'MY_CLI_TOKEN', required: true }),
}
```

### Check for TTY Before Prompting

Non-interactive environments (CI, pipes, cron) will hang on prompts. Always check `process.stdin.isTTY` and provide a `--no-input` or `--yes` flag for non-interactive use:

```typescript
async run() {
  const { flags } = await this.parse(MyCommand)
  if (!flags.yes && !process.stdin.isTTY) {
    this.error('Cannot prompt for confirmation in non-interactive mode. Use --yes.', {
      exit: 1,
      suggestions: ['Re-run with --yes to skip confirmation'],
    })
  }
}
```

### Suggest Corrections — Never Auto-Execute Them

For state-modifying operations, show the user what you think they meant and ask for confirmation. Do not silently auto-correct commands that could delete, modify, or create resources.

***

## 15. Common Pitfalls and Anti-Patterns

### Architecture Pitfalls

- **Putting all imports at the top of command files** — forces everything to load at startup. Use dynamic `import()` for heavy dependencies inside `run()`.
- **Deeply nested topic hierarchies (3+ levels)** — hurts discoverability and UX. Keep nesting to 1-2 levels.
- **Not creating a custom base command** — leads to duplicated auth, error handling, and flag definitions.
- **Modifying `Config` properties at runtime** — they are `readonly` in v3+; attempts will fail silently or error.
- **Over-engineering with plugins for simple CLIs** — if you have fewer than ~20 commands, the plugin overhead may not be worth it.

### Output Pitfalls

- **Mixing stdout and stderr** — primary output must go to stdout, diagnostics/errors to stderr. This is critical for piping (`mycli list | jq .`).
- **Inconsistent output formats across commands** — standardize on `--json` for machine output across all data-returning commands.
- **No exit codes** — always return 0 for success, non-zero for failure. Scripts depend on this.
- **Displaying raw stack traces to users** — use `this.error('Human message')` and reserve stack traces for `--debug` mode.

### Testing Pitfalls

- **Using `console.log` for debugging with `.stdout()` capture** — debug output gets captured and pollutes assertions.
- **Not configuring Vitest/Jest correctly** — oclif relies on native streams; interceptors break output capture.
- **Testing only the happy path** — every command with error branches needs tests that validate `exit` code and `error.code`.

***

## Quick Reference: Rules Summary

| # | Rule |
|---|---|
| 1 | Scaffold with `oclif generate` — never start from scratch |
| 2 | One command per file; file path = command ID |
| 3 | Always provide `summary`, `description`, and `examples` |
| 4 | `await` every `Promise` inside `run()` |
| 5 | Use `this.log/warn/error` — never `console.log` |
| 6 | Use typed flags (`Flags.string`, `Flags.option`, etc.) |
| 7 | Declare flag relationships in config, not in `run()` logic |
| 8 | Always create a `BaseCommand` for multi-command CLIs |
| 9 | Override `catch()` in `BaseCommand` for global error handling |
| 10 | Set `enableJsonFlag = true` on all data-returning commands |
| 11 | Use `ux.action` or `ora` for long-running async work |
| 12 | Enable `flexibleTaxonomy` for large multi-command CLIs |
| 13 | Decompose large CLIs into plugins |
| 14 | Use lifecycle hooks for cross-cutting concerns |
| 15 | Test with `runCommand` + `nock`; always test error paths |
| 16 | Lazy-load heavy dependencies with dynamic `import()` inside `run()` |
| 17 | Use `this.config.configDir/cacheDir/dataDir` — never hardcode paths |
| 18 | Follow config precedence: flags > env vars > project > user > system |
| 19 | Never accept secrets via flags — use env vars or credential files |
| 20 | Check for TTY before prompting; provide `--no-input` flag |
| 21 | Send output to stdout, errors to stderr — never mix them |
| 22 | Always return meaningful exit codes (0 = success, non-zero = failure) |