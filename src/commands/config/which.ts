import {Command, Flags} from '@oclif/core'

import {globalConfigPath, whichApiKeySource} from '../../lib/config.js'
import {printJson} from '../../lib/json-output.js'

export default class ConfigWhich extends Command {
  static description = 'Show where the Browserbase API key would be loaded from (no secret printed)'
  static examples = ['<%= config.bin %> config which', '<%= config.bin %> config which --json']
  static flags = {
    'api-key': Flags.string({
      char: 'k',
      description: 'Simulate passing --api-key on other commands',
    }),
    json: Flags.boolean({
      description: 'Print machine-readable JSON to stdout',
      env: 'ZURF_JSON',
    }),
  }

  async run(): Promise<void> {
    const {flags} = await this.parse(ConfigWhich)
    const which = whichApiKeySource({flagKey: flags['api-key']})

    if (flags.json) {
      switch (which.kind) {
        case 'env': {
          printJson({envVar: 'BROWSERBASE_API_KEY', source: 'env'})
          break
        }

        case 'flag': {
          printJson({source: 'flag'})
          break
        }

        case 'global': {
          printJson({path: which.path, source: 'global'})
          break
        }

        case 'local': {
          printJson({path: which.path, source: 'local'})
          break
        }

        case 'none': {
          printJson({
            globalConfigPath: globalConfigPath(),
            hint: `Run \`${this.config.bin} init --global\` or \`${this.config.bin} init --local\`, or set BROWSERBASE_API_KEY.`,
            source: 'none',
          })
          this.exit(1)
        }
      }

      return
    }

    switch (which.kind) {
      case 'env': {
        this.log('API key source: environment variable BROWSERBASE_API_KEY')
        break
      }

      case 'flag': {
        this.log('API key source: --api-key / -k flag')
        break
      }

      case 'global': {
        this.log(`API key source: global file ${which.path}`)
        break
      }

      case 'local': {
        this.log(`API key source: local file ${which.path}`)
        break
      }

      case 'none': {
        this.error(
          `No API key configured. Set BROWSERBASE_API_KEY or run \`${this.config.bin} init --global\` / \`--local\`.`,
        )
      }
    }
  }
}
