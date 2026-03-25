import {Command, Flags} from '@oclif/core'
import * as readline from 'node:readline'

import {globalConfigPath, localConfigPathForCwd, writeApiKeyConfig} from '../../lib/config.js'
import {printErrorJson, printJson} from '../../lib/json-output.js'

async function readStdinIfPiped(): Promise<string | undefined> {
  if (process.stdin.isTTY) {
    return undefined
  }

  const chunks: Buffer[] = []
  for await (const chunk of process.stdin) {
    chunks.push(chunk as Buffer)
  }

  const s = Buffer.concat(chunks).toString('utf8').trim()
  return s.length > 0 ? s : undefined
}

function promptLine(question: string): Promise<string> {
  const rl = readline.createInterface({input: process.stdin, output: process.stdout})
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close()
      resolve(answer.trim())
    })
  })
}

export default class Init extends Command {
  static description = 'Save your Browserbase API key to global or project config'
  static examples = [
    '<%= config.bin %> <%= command.id %> --global',
    '<%= config.bin %> <%= command.id %> --local',
    'printenv BROWSERBASE_API_KEY | <%= config.bin %> <%= command.id %> --global',
  ]
  static flags = {
    'api-key': Flags.string({
      char: 'k',
      description: 'API key (non-interactive); otherwise read from stdin pipe or prompt',
    }),
    global: Flags.boolean({
      description: 'Store API key in user config (~/.config/zurf or XDG equivalent)',
      exclusive: ['local'],
    }),
    json: Flags.boolean({
      description: 'Print machine-readable JSON to stdout',
      env: 'ZURF_JSON',
    }),
    local: Flags.boolean({
      description: 'Store API key in ./.zurf/config.json for this directory',
      exclusive: ['global'],
    }),
  }

  async run(): Promise<void> {
    const {flags} = await this.parse(Init)

    if (!flags.global && !flags.local) {
      const msg = 'Specify exactly one of --global or --local.'
      if (flags.json) {
        printErrorJson(msg)
        this.exit(2)
      }

      this.error(msg)
    }

    let apiKey = flags['api-key']?.trim()

    if (!apiKey) {
      apiKey = await readStdinIfPiped()
    }

    if (!apiKey && process.stdin.isTTY) {
      apiKey = await promptLine('Browserbase API key: ')
    }

    if (!apiKey) {
      const msg = 'No API key provided. Use --api-key, pipe stdin, or run interactively in a TTY.'
      if (flags.json) {
        printErrorJson(msg)
        this.exit(2)
      }

      this.error(msg)
    }

    const targetPath = flags.global ? globalConfigPath() : localConfigPathForCwd()

    try {
      await writeApiKeyConfig(targetPath, apiKey)
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      if (flags.json) {
        printErrorJson(message)
        this.exit(1)
      }

      this.error(message)
    }

    if (flags.json) {
      printJson({ok: true, path: targetPath, scope: flags.global ? 'global' : 'local'})
    } else {
      this.log(`Saved API key to ${targetPath}`)
      if (flags.local) {
        this.log('Tip: add .zurf/ to .gitignore so the key is not committed.')
      }
    }
  }
}
