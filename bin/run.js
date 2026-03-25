#!/usr/bin/env node

import {flush, handle, run} from '@oclif/core'

import {CliJsonExitContractError} from '../dist/lib/cli-errors.js'

try {
  await run(process.argv.slice(2), import.meta.url)
} catch (error) {
  if (error instanceof CliJsonExitContractError) {
    process.exitCode = 1
  } else {
    await handle(error)
  }
} finally {
  await flush()
}
