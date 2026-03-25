/* eslint-disable n/no-unsupported-features/node-builtins -- register ts-node ESM for mocha */
import {register} from 'node:module'
import {pathToFileURL} from 'node:url'

register('ts-node/esm', pathToFileURL(`${process.cwd()}/`))
