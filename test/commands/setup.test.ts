import {runCommand} from '@oclif/test'
import {expect} from 'chai'
import * as fs from 'node:fs'
import * as os from 'node:os'
import path from 'node:path'

import {captureEnv, restoreEnv} from '../helpers/env-sandbox.js'
import {packageRoot} from '../helpers/package-root.js'

const ENV_KEYS = ['BROWSERBASE_API_KEY', 'PERPLEXITY_API_KEY', 'XDG_CONFIG_HOME'] as const

describe('setup', () => {
  let xdg: string
  let cwd: string
  let prevCwd: string
  let envSnapshot: Map<string, string | undefined>

  beforeEach(() => {
    envSnapshot = captureEnv(ENV_KEYS)
    xdg = fs.mkdtempSync(path.join(os.tmpdir(), 'zurf-setup-xdg-'))
    cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'zurf-setup-cwd-'))
    process.env.XDG_CONFIG_HOME = xdg
    prevCwd = process.cwd()
    process.chdir(cwd)
    delete process.env.BROWSERBASE_API_KEY
    delete process.env.PERPLEXITY_API_KEY
  })

  afterEach(() => {
    process.chdir(prevCwd)
    fs.rmSync(xdg, {force: true, recursive: true})
    fs.rmSync(cwd, {force: true, recursive: true})
    restoreEnv(envSnapshot)
  })

  it('errors when both --global and --local are set', async () => {
    const {error, stdout} = await runCommand('setup --global --local --json', packageRoot)
    expect(error).to.be.instanceOf(Error)
    const output = stdout.trim()
    if (output) {
      const j = JSON.parse(output)
      expect(j.error.message).to.contain('Cannot use both --global and --local')
    }
  })

  it('errors in non-interactive mode without scope flag', async () => {
    // In test environment, stdin is not a TTY, so this should trigger the TTY guard
    const {error, stdout} = await runCommand('setup --json', packageRoot)
    expect(error).to.be.instanceOf(Error)
    const output = stdout.trim()
    if (output) {
      const j = JSON.parse(output)
      expect(j.error.message).to.contain('Non-interactive environment')
    }
  })

  it('shows setup in help output', async () => {
    const {stdout} = await runCommand('setup --help', packageRoot)
    expect(stdout).to.contain('Configure API keys')
  })
})
