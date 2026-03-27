import {runCommand} from '@oclif/test'
import {expect} from 'chai'
import * as fs from 'node:fs'
import * as os from 'node:os'
import path from 'node:path'

import {captureEnv, restoreEnv} from '../helpers/env-sandbox.js'
import {packageRoot} from '../helpers/package-root.js'

const ENV_KEYS = ['PERPLEXITY_API_KEY', 'XDG_CONFIG_HOME'] as const

describe('ask', () => {
  let xdg: string
  let envSnapshot: Map<string, string | undefined>

  beforeEach(() => {
    envSnapshot = captureEnv(ENV_KEYS)
    xdg = fs.mkdtempSync(path.join(os.tmpdir(), 'zurf-ask-'))
    process.env.XDG_CONFIG_HOME = xdg
    delete process.env.PERPLEXITY_API_KEY
  })

  afterEach(() => {
    fs.rmSync(xdg, {force: true, recursive: true})
    restoreEnv(envSnapshot)
  })

  it('errors when no question arg provided', async () => {
    process.env.PERPLEXITY_API_KEY = 'pplx-test'
    const {error} = await runCommand('ask', packageRoot)
    expect(error).to.be.instanceOf(Error)
    expect(error?.message).to.contain('Missing 1 required arg')
  })

  it('errors when API key is missing with helpful message', async () => {
    const {error, stdout} = await runCommand('ask "test question" --json', packageRoot)
    expect(error).to.be.instanceOf(Error)
    const output = stdout.trim()
    if (output) {
      const j = JSON.parse(output)
      expect(j.error.message).to.contain('No Perplexity API key found')
    }
  })

  it('rejects invalid depth value', async () => {
    process.env.PERPLEXITY_API_KEY = 'pplx-test'
    const {error} = await runCommand('ask "test" --depth invalid', packageRoot)
    expect(error).to.be.instanceOf(Error)
    expect(error?.message).to.contain('Expected --depth=invalid to be one of: quick, deep')
  })

  it('rejects invalid recency value', async () => {
    process.env.PERPLEXITY_API_KEY = 'pplx-test'
    const {error} = await runCommand('ask "test" --recency invalid', packageRoot)
    expect(error).to.be.instanceOf(Error)
    expect(error?.message).to.contain('Expected --recency=invalid to be one of: hour, day, week, month, year')
  })
})
