import {Browserbase} from '@browserbasehq/sdk'

import {resolveApiKey, type ResolvedApiKey} from './config.js'

export function createBrowserbaseClient(options: {
  cwd?: string
  flagKey?: string | undefined
}): {client: Browserbase; resolution: ResolvedApiKey & {source: 'env' | 'flag' | 'global' | 'local'}} {
  const resolution = resolveApiKey({cwd: options.cwd, flagKey: options.flagKey})

  if (resolution.source === 'none') {
    throw new MissingApiKeyError()
  }

  const client = new Browserbase({apiKey: resolution.apiKey})
  return {client, resolution}
}

export class MissingApiKeyError extends Error {
  constructor() {
    super(
      'No Browserbase API key found. Set BROWSERBASE_API_KEY, run `zurf init --global` or `zurf init --local`, or pass --api-key.',
    )
    this.name = 'MissingApiKeyError'
  }
}
