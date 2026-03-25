import {Flags} from '@oclif/core'

/** Shared flags for commands that call Browserbase (do not set `env` on api-key — resolution is centralized). */
export const zurfBaseFlags = {
  'api-key': Flags.string({
    char: 'k',
    description: 'Browserbase API key (overrides env and config files)',
  }),
  json: Flags.boolean({
    description: 'Print machine-readable JSON to stdout',
    env: 'ZURF_JSON',
  }),
} as const
