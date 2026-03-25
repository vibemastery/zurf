import {APIError} from '@browserbasehq/sdk'

export function errorMessage(err: unknown): string {
  if (err instanceof APIError) {
    return err.message
  }

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
