#!/usr/bin/env node

import {execute} from '@oclif/core'

import {CliJsonExitContractError} from '../dist/lib/cli-errors.js'

try {
  await execute({dir: import.meta.url})
} catch (error) {
  if (error instanceof CliJsonExitContractError) {
    process.exitCode = 1
  } else {
    throw error
  }
}
