import {runCommand} from '@oclif/test'
import {expect} from 'chai'
import * as fs from 'node:fs'
import * as os from 'node:os'
import path from 'node:path'

import {captureEnv, restoreEnv} from '../helpers/env-sandbox.js'
import {packageRoot} from '../helpers/package-root.js'

const ENV_KEYS = ['SUPADATA_API_KEY', 'XDG_CONFIG_HOME'] as const

describe('transcript', () => {
  let xdg: string
  let envSnapshot: Map<string, string | undefined>

  beforeEach(() => {
    envSnapshot = captureEnv(ENV_KEYS)
    xdg = fs.mkdtempSync(path.join(os.tmpdir(), 'zurf-transcript-'))
    process.env.XDG_CONFIG_HOME = xdg
    delete process.env.SUPADATA_API_KEY
  })

  afterEach(() => {
    fs.rmSync(xdg, {force: true, recursive: true})
    restoreEnv(envSnapshot)
  })

  it('errors when no URL arg provided', async () => {
    process.env.SUPADATA_API_KEY = 'sd-test'
    const {error} = await runCommand('transcript', packageRoot)
    expect(error).to.be.instanceOf(Error)
    expect(error?.message).to.contain('Missing 1 required arg')
  })

  it('errors when API key is missing with helpful message', async () => {
    const {error, stdout} = await runCommand('transcript https://www.youtube.com/watch?v=abc --json', packageRoot)
    expect(error).to.be.instanceOf(Error)
    const output = stdout.trim()
    if (output) {
      const j = JSON.parse(output)
      expect(j.error.message).to.contain('No Supadata API key found')
    }
  })

  it('rejects invalid mode value', async () => {
    process.env.SUPADATA_API_KEY = 'sd-test'
    const {error} = await runCommand('transcript https://www.youtube.com/watch?v=abc --mode invalid', packageRoot)
    expect(error).to.be.instanceOf(Error)
    expect(error?.message).to.contain('Expected --mode=invalid to be one of: native, generate, auto')
  })

  it('rejects invalid URL (not http/https)', async () => {
    process.env.SUPADATA_API_KEY = 'sd-test'
    const {error} = await runCommand('transcript ftp://example.com/video --json', packageRoot)
    expect(error).to.be.instanceOf(Error)
    const output = (await runCommand('transcript ftp://example.com/video --json', packageRoot)).stdout.trim()
    if (output) {
      const j = JSON.parse(output)
      expect(j.error.message).to.contain('http or https')
    }
  })
})
