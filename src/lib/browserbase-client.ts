import type {Browserbase} from '@browserbasehq/sdk'

import {type ActiveApiKey, resolveApiKey} from './config.js'

export async function createBrowserbaseClient(options: {
  cwd?: string
  globalConfigDir: string
}): Promise<{client: Browserbase; resolution: ActiveApiKey}> {
  const {Browserbase} = await import('@browserbasehq/sdk')
  const resolution = resolveApiKey({cwd: options.cwd, globalConfigDir: options.globalConfigDir})

  if (resolution.source === 'none') {
    throw new MissingApiKeyError()
  }

  const client = new Browserbase({apiKey: resolution.apiKey})
  return {client, resolution}
}

export class MissingApiKeyError extends Error {
  constructor() {
    super(
      'No Browserbase API key found. Set BROWSERBASE_API_KEY, run `zurf init --global` or `zurf init --local`, or add a project `.zurf/config.json`.',
    )
    this.name = 'MissingApiKeyError'
  }
}
