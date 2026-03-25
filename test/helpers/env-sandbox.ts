/**
 * Capture selected `process.env` entries for restore in `afterEach`.
 * Many tests also call `process.chdir()` — keep mocha serial (default); do not run these tests in parallel workers.
 */
export function captureEnv(keys: readonly string[]): Map<string, string | undefined> {
  const saved = new Map<string, string | undefined>()
  for (const key of keys) {
    saved.set(key, process.env[key])
  }

  return saved
}

export function restoreEnv(saved: Map<string, string | undefined>): void {
  for (const [key, value] of saved) {
    if (value === undefined) {
      delete process.env[key]
    } else {
      process.env[key] = value
    }
  }
}
