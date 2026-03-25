import type {Browserbase} from '@browserbasehq/sdk'

import {Command, ux} from '@oclif/core'

import {getBrowserbaseClientOrExit} from './browserbase-command.js'
import {cliError, errorMessage, errorStatus} from './cli-errors.js'

/** Shared behavior for commands that call Browserbase: client resolution, optional spinner, unified API error handling. */
export abstract class ZurfBrowserbaseCommand extends Command {
  protected async runWithBrowserbase(
    flags: {json: boolean},
    spinnerLabel: string,
    work: (client: Browserbase) => Promise<void>,
  ): Promise<void> {
    const {client} = await getBrowserbaseClientOrExit(this, flags, {
      globalConfigDir: this.config.configDir,
    })

    const run = async (): Promise<void> => {
      try {
        await work(client)
      } catch (error) {
        cliError({
          command: this,
          exitCode: 1,
          json: flags.json,
          message: errorMessage(error),
          statusCode: errorStatus(error),
        })
      }
    }

    if (flags.json) {
      await run()
      return
    }

    ux.action.start(spinnerLabel)
    try {
      await run()
    } finally {
      ux.action.stop()
    }
  }
}
