import type {Command} from '@oclif/core'

import {printErrorJson} from './json-output.js'

export type CliErrorOptions = {
  command: Command
  exitCode?: number
  json: boolean
  message: string
  statusCode?: number | string
}

/**
 * Thrown only if `command.exit` returns without throwing (e.g. test double). JSON is already on stdout.
 * Caught in `bin/run.js` / `bin/dev.js` so this does not surface as an unhandled rejection.
 */
export class CliJsonExitContractError extends Error {
  constructor() {
    super(
      'zurf internal error: command.exit() returned after JSON error output; fix the test double or oclif version.',
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

export function errorCode(err: unknown): string | undefined {
  if (
    err !== null &&
    typeof err === 'object' &&
    'code' in err &&
    typeof (err as {code: unknown}).code === 'string'
  ) {
    return (err as {code: string}).code
  }

  return undefined
}

export function errorStatus(err: unknown): number | undefined {
  if (
    err !== null &&
    typeof err === 'object' &&
    'status' in err &&
    typeof (err as {status: unknown}).status === 'number'
  ) {
    return (err as {status: number}).status
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
