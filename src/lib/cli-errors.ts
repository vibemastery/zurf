import type {Command} from '@oclif/core'

import {APIError} from '@browserbasehq/sdk'

import {printErrorJson} from './json-output.js'

export type CliErrorOptions = {
  command: Command
  exitCode?: number
  json: boolean
  message: string
  statusCode?: number | string
}

/** Thrown only if `command.exit` returns without throwing (e.g. test double). JSON is already on stdout. */
export class CliJsonExitContractError extends Error {
  constructor() {
    super(
      'zurf: command.exit() returned after JSON error output; refusing to call command.error() and corrupt stdout.',
    )
    this.name = 'CliJsonExitContractError'
  }
}

export function errorMessage(err: unknown): string {
  if (err instanceof Error) {
    return err.message
  }

  return String(err)
}

export function errorStatus(err: unknown): number | undefined {
  if (err instanceof APIError) {
    return err.status
  }

  return undefined
}

/** Print JSON or human error and exit; does not return. */
export function cliError(options: CliErrorOptions): never {
  const {command, exitCode = 1, json, message, statusCode} = options
  if (json) {
    printErrorJson(message, statusCode)
    command.exit(exitCode)
    throw new CliJsonExitContractError()
  }

  return command.error(message, {exit: exitCode}) as never
}
