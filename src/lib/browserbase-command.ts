import type {Command} from '@oclif/core'

import {createBrowserbaseClient, MissingApiKeyError} from './browserbase-client.js'
import {cliError} from './cli-errors.js'

export async function getBrowserbaseClientOrExit(
  command: Command,
  flags: {json: boolean},
  options: {cwd?: string; globalConfigDir: string},
): Promise<Awaited<ReturnType<typeof createBrowserbaseClient>>> {
  try {
    return await createBrowserbaseClient({
      cwd: options.cwd,
      globalConfigDir: options.globalConfigDir,
    })
  } catch (error) {
    if (error instanceof MissingApiKeyError) {
      cliError({command, exitCode: 2, json: flags.json, message: error.message})
    }

    throw error
  }
}
