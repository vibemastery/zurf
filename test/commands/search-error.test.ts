import {runCommand} from '@oclif/test'
import {expect} from 'chai'
import * as fs from 'node:fs'
import * as os from 'node:os'
import path from 'node:path'

import {captureEnv, restoreEnv} from '../helpers/env-sandbox.js'
import {packageRoot} from '../helpers/package-root.js'
const ENV_KEYS = ['BROWSERBASE_API_KEY', 'XDG_CONFIG_HOME'] as const

describe('search without API key', () => {
  let tmp: string
  let envSnapshot: Map<string, string | undefined>

  beforeEach(() => {
    envSnapshot = captureEnv(ENV_KEYS)
    tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'zurf-search-'))
    delete process.env.BROWSERBASE_API_KEY
    process.env.XDG_CONFIG_HOME = path.join(tmp, 'empty-xdg')
  })

  afterEach(() => {
    fs.rmSync(tmp, {force: true, recursive: true})
    restoreEnv(envSnapshot)
  })

  it('emits JSON error with --json', async () => {
    const {error, stdout} = await runCommand('search "test query" --json', packageRoot)
    expect(error).to.be.instanceOf(Error)
    const j = JSON.parse(stdout.trim())
    expect(j.error).to.have.property('message')
    expect(j.error.message as string).to.contain('API key')
  })
})
