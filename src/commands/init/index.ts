import {Command, Flags} from '@oclif/core'
import * as fs from 'node:fs/promises'

import {cliError, errorMessage} from '../../lib/cli-errors.js'
import {globalConfigFilePath, localConfigPathForCwd, writeApiKeyConfig} from '../../lib/config.js'
import {zurfBaseFlags} from '../../lib/flags.js'
import {
  dotGitignoreMentionsZurf,
  ensureZurfGitignoreEntry,
  gitignorePathForCwd,
} from '../../lib/gitignore-zurf.js'
import {promptLine, readStdinIfPiped} from '../../lib/init-input.js'
import {printJson} from '../../lib/json-output.js'

export default class Init extends Command {
  static description = `Save your Browserbase API key to global or project config.
Global path follows oclif config (same as \`zurf config which\`).`
  static examples = [
    '<%= config.bin %> <%= command.id %> --global',
    '<%= config.bin %> <%= command.id %> --local',
    'printenv BROWSERBASE_API_KEY | <%= config.bin %> <%= command.id %> --global',
  ]
  static flags = {
    ...zurfBaseFlags,
    'api-key': Flags.string({
      description:
        'API key for non-interactive use. Prefer piping stdin or using a TTY prompt — values on the command line are visible in shell history and process listings.',
    }),
    gitignore: Flags.boolean({
      description: 'Append .zurf/ to ./.gitignore if that entry is missing',
    }),
    global: Flags.boolean({
      description: 'Store API key in user config (oclif config dir for this CLI)',
      exactlyOne: ['global', 'local'],
    }),
    local: Flags.boolean({
      description: 'Store API key in ./.zurf/config.json for this directory',
      exactlyOne: ['global', 'local'],
    }),
  }
  static summary = 'Configure Browserbase API key storage'

  async run(): Promise<void> {
    const {flags} = await this.parse(Init)

    const apiKey = await this.readApiKeyForInit(flags)
    const targetPath = flags.global
      ? globalConfigFilePath(this.config.configDir)
      : localConfigPathForCwd()

    try {
      await writeApiKeyConfig(targetPath, apiKey)
    } catch (error) {
      cliError({command: this, exitCode: 1, json: flags.json, message: errorMessage(error)})
    }

    if (flags.gitignore) {
      try {
        await ensureZurfGitignoreEntry(gitignorePathForCwd())
      } catch (error) {
        cliError({command: this, exitCode: 1, json: flags.json, message: errorMessage(error)})
      }
    }

    if (flags.json) {
      printJson({ok: true, path: targetPath, scope: flags.global ? 'global' : 'local'})
    } else {
      this.log(`Saved API key to ${targetPath}`)
      if (flags.local) {
        let showTip = true
        try {
          const gi = await fs.readFile(gitignorePathForCwd(), 'utf8')
          if (dotGitignoreMentionsZurf(gi)) {
            showTip = false
          }
        } catch {
          // no .gitignore yet
        }

        if (showTip) {
          this.log('Tip: add .zurf/ to .gitignore so the key is not committed (or run with --gitignore).')
        }
      }
    }
  }

  private async readApiKeyForInit(flags: {'api-key'?: string; json: boolean}): Promise<string> {
    let apiKey = flags['api-key']?.trim()
    if (!apiKey) {
      apiKey = await readStdinIfPiped()
    }

    if (!apiKey && process.stdin.isTTY) {
      apiKey = await promptLine('Browserbase API key: ')
    }

    if (!apiKey) {
      cliError({
        command: this,
        exitCode: 2,
        json: flags.json,
        message: 'No API key provided. Pipe stdin, use --api-key, or run interactively in a TTY.',
      })
    }

    return apiKey
  }
}
