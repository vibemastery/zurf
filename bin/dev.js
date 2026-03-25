#!/usr/bin/env node
/* eslint-disable n/no-unsupported-features/node-builtins -- register ts-node ESM */
/* eslint-disable n/no-unpublished-import -- dev bundle loads ../src */

import {register} from 'node:module'
import {dirname, join} from 'node:path'
import {fileURLToPath, pathToFileURL} from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
register('ts-node/esm', pathToFileURL(`${root}/`))

const {execute} = await import('@oclif/core')
const {CliJsonExitContractError} = await import('../src/lib/cli-errors.js')

try {
  await execute({development: true, dir: import.meta.url})
} catch (error) {
  if (error instanceof CliJsonExitContractError) {
    process.exitCode = 1
  } else {
    throw error
  }
}
