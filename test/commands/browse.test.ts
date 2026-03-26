import {runCommand} from '@oclif/test'
import {expect} from 'chai'
import * as fs from 'node:fs'
import * as os from 'node:os'
import path from 'node:path'

import {captureEnv, restoreEnv} from '../helpers/env-sandbox.js'
import {packageRoot} from '../helpers/package-root.js'

const ENV_KEYS = ['BROWSERBASE_API_KEY', 'BROWSERBASE_PROJECT_ID', 'XDG_CONFIG_HOME', 'ZURF_HTML'] as const

describe('browse', () => {
  let tmp: string
  let envSnapshot: Map<string, string | undefined>

  beforeEach(() => {
    envSnapshot = captureEnv(ENV_KEYS)
    tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'zurf-browse-'))
    delete process.env.BROWSERBASE_API_KEY
    delete process.env.BROWSERBASE_PROJECT_ID
    process.env.XDG_CONFIG_HOME = path.join(tmp, 'empty-xdg')
  })

  afterEach(() => {
    fs.rmSync(tmp, {force: true, recursive: true})
    restoreEnv(envSnapshot)
  })

  it('rejects invalid URL before requiring API key', async () => {
    const {error, stdout} = await runCommand('browse "not a url" --json', packageRoot)
    expect(error).to.be.instanceOf(Error)
    const j = JSON.parse(stdout.trim())
    expect(j.error.message as string).to.contain('Invalid URL')
  })

  it('rejects non-http(s) URLs before requiring API key', async () => {
    const {error, stdout} = await runCommand('browse "file:///etc/passwd" --json', packageRoot)
    expect(error).to.be.instanceOf(Error)
    const j = JSON.parse(stdout.trim())
    expect(j.error.message as string).to.match(/http|https/i)
  })

  it('emits JSON error when API key is missing', async () => {
    const {error, stdout} = await runCommand('browse https://example.com --json', packageRoot)
    expect(error).to.be.instanceOf(Error)
    const j = JSON.parse(stdout.trim())
    expect(j.error).to.have.property('message')
    expect(j.error.message as string).to.contain('API key')
  })

  it('emits JSON error when Project ID is missing', async () => {
    process.env.BROWSERBASE_API_KEY = 'bb_test_key'
    const {error, stdout} = await runCommand('browse https://example.com --json', packageRoot)
    expect(error).to.be.instanceOf(Error)
    const j = JSON.parse(stdout.trim())
    expect(j.error).to.have.property('message')
    expect(j.error.message as string).to.contain('Project ID')
  })
})
