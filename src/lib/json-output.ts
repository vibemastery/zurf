export function printJson(value: unknown): void {
  process.stdout.write(`${JSON.stringify(value)}\n`)
}

/** JSON errors use stdout on purpose so `--json` callers get a single stream for piping/parsing. */
export function printErrorJson(message: string, code?: number | string): void {
  const payload: {error: {code?: number | string; message: string}} = {error: {message}}
  if (code !== undefined) {
    payload.error.code = code
  }

  process.stdout.write(`${JSON.stringify(payload)}\n`)
}
