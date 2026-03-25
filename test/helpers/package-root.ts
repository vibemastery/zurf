import path from 'node:path'
import {fileURLToPath} from 'node:url'

/** Repo root for `runCommand(..., packageRoot)` (two levels up from `test/helpers/`). */
export const packageRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..')
