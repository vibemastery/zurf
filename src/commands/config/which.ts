import {Command} from '@oclif/core'

import {globalConfigFilePath, resolveApiKey, type ResolvedApiKey, type ResolvedPerplexityApiKey, resolvePerplexityApiKey} from '../../lib/config.js'
import {zurfBaseFlags} from '../../lib/flags.js'
import {printJson} from '../../lib/json-output.js'

type AnyResolved = ResolvedApiKey | ResolvedPerplexityApiKey

function resolvedSource(resolved: AnyResolved): Record<string, unknown> {
  switch (resolved.source) {
    case 'env': {
      return {source: 'env'}
    }

    case 'global':
    case 'local': {
      return {path: resolved.path, source: resolved.source}
    }

    default: {
      return {source: 'none'}
    }
  }
}

function humanSourceLine(label: string, resolved: AnyResolved, envVarName: string): string {
  switch (resolved.source) {
    case 'env': {
      return `${label}: environment variable ${envVarName}`
    }

    case 'global': {
      return `${label}: global file ${resolved.path}`
    }

    case 'local': {
      return `${label}: local file ${resolved.path}`
    }

    default: {
      return `${label}: not configured`
    }
  }
}

export default class ConfigWhich extends Command {
  static description = `Show where API keys would be loaded from (no secrets printed).
Resolution order: env var → project .zurf/config.json (walk-up) → global config.`
  static examples = ['<%= config.bin %> config which', '<%= config.bin %> config which --json']
  static flags = {
    ...zurfBaseFlags,
  }
  static summary = 'Show where API keys are loaded from'

  async run(): Promise<void> {
    const {flags} = await this.parse(ConfigWhich)
    const bbResolved = resolveApiKey({globalConfigDir: this.config.configDir})
    const pplxResolved = resolvePerplexityApiKey({globalConfigDir: this.config.configDir})

    if (flags.json) {
      const payload: Record<string, unknown> = {
        browserbase: resolvedSource(bbResolved),
        perplexity: resolvedSource(pplxResolved),
      }

      if (bbResolved.source === 'none' && pplxResolved.source === 'none') {
        payload.globalConfigPath = globalConfigFilePath(this.config.configDir)
        payload.hint = `Run \`${this.config.bin} setup\` or set BROWSERBASE_API_KEY / PERPLEXITY_API_KEY.`
      }

      printJson(payload)

      if (bbResolved.source === 'none' && pplxResolved.source === 'none') {
        this.exit(1)
      }

      return
    }

    this.log(humanSourceLine('Browserbase API key', bbResolved, 'BROWSERBASE_API_KEY'))
    this.log(humanSourceLine('Perplexity API key', pplxResolved, 'PERPLEXITY_API_KEY'))

    if (bbResolved.source === 'none' && pplxResolved.source === 'none') {
      this.error(
        `No API keys configured. Run \`${this.config.bin} setup\` or set environment variables.`,
      )
    }
  }
}
