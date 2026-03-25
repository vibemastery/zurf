import type {Command} from '@oclif/core'

import {createBrowserbaseClient, MissingApiKeyError} from './browserbase-client.js'
import {cliError} from './cli-errors.js'

export function getBrowserbaseClientOrExit(
  command: Command,
  flags: {'api-key'?: string; json: boolean},
  options?: {cwd?: string},
): ReturnType<typeof createBrowserbaseClient> {
  try {
    return createBrowserbaseClient({cwd: options?.cwd, flagKey: flags['api-key']})
  } catch (error) {
    if (error instanceof MissingApiKeyError) {
      cliError({command, exitCode: 2, json: flags.json, message: error.message})
    }

    throw error
  }
}
