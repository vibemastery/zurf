import {Flags} from '@oclif/core'

/** Machine-readable output; kept separate from oclif `enableJsonFlag` so error payloads match zurf's stdout JSON contract. */
export const zurfJsonFlag = Flags.boolean({
  description: 'Print machine-readable JSON to stdout',
  env: 'ZURF_JSON',
})

/** Shared flags for commands that support JSON output (no `--api-key` — use BROWSERBASE_API_KEY or config files). */
export const zurfBaseFlags = {
  json: zurfJsonFlag,
} as const
