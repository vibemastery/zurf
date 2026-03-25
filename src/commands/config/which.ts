import {Command} from '@oclif/core'

import {globalConfigFilePath, resolveApiKey} from '../../lib/config.js'
import {zurfBaseFlags} from '../../lib/flags.js'
import {printJson} from '../../lib/json-output.js'

export default class ConfigWhich extends Command {
  static description = `Show where the Browserbase API key would be loaded from (no secret printed).
Resolution order: BROWSERBASE_API_KEY, then project .zurf/config.json (walk-up), then global config in the CLI config directory.`
  static examples = ['<%= config.bin %> config which', '<%= config.bin %> config which --json']
  static flags = {
    ...zurfBaseFlags,
  }
  static summary = 'Show where the API key is loaded from'

  async run(): Promise<void> {
    const {flags} = await this.parse(ConfigWhich)
    const resolved = resolveApiKey({globalConfigDir: this.config.configDir})

    if (flags.json) {
      switch (resolved.source) {
        case 'env': {
          printJson({envVar: 'BROWSERBASE_API_KEY', source: 'env'})
          break
        }

        case 'global': {
          printJson({path: resolved.path, source: 'global'})
          break
        }

        case 'local': {
          printJson({path: resolved.path, source: 'local'})
          break
        }

        case 'none': {
          printJson({
            globalConfigPath: globalConfigFilePath(this.config.configDir),
            hint: `Run \`${this.config.bin} init --global\` or \`${this.config.bin} init --local\`, or set BROWSERBASE_API_KEY.`,
            source: 'none',
          })
          this.exit(1)
          break
        }
      }

      return
    }

    switch (resolved.source) {
      case 'env': {
        this.log('API key source: environment variable BROWSERBASE_API_KEY')
        break
      }

      case 'global': {
        this.log(`API key source: global file ${resolved.path}`)
        break
      }

      case 'local': {
        this.log(`API key source: local file ${resolved.path}`)
        break
      }

      case 'none': {
        this.error(
          `No API key configured. Set BROWSERBASE_API_KEY or run \`${this.config.bin} init --global\` / \`--local\`.`,
        )
        break
      }
    }
  }
}
