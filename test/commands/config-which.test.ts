import {runCommand} from '@oclif/test'
import {expect} from 'chai'
import * as fs from 'node:fs'
import * as os from 'node:os'
import path from 'node:path'
import {fileURLToPath} from 'node:url'

import {writeApiKeyConfig} from '../../src/lib/config.js'
import {captureEnv, restoreEnv} from '../helpers/env-sandbox.js'

const packageRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..')
const ENV_KEYS = ['BROWSERBASE_API_KEY', 'XDG_CONFIG_HOME'] as const

describe('config which', () => {
  let xdg: string
  let envSnapshot: Map<string, string | undefined>

  beforeEach(() => {
    envSnapshot = captureEnv(ENV_KEYS)
    xdg = fs.mkdtempSync(path.join(os.tmpdir(), 'zurf-which-'))
    process.env.XDG_CONFIG_HOME = xdg
    delete process.env.BROWSERBASE_API_KEY
  })

  afterEach(() => {
    fs.rmSync(xdg, {force: true, recursive: true})
    restoreEnv(envSnapshot)
  })

  it('reports env when BROWSERBASE_API_KEY is set', async () => {
    process.env.BROWSERBASE_API_KEY = 'secret'
    const {error, stdout} = await runCommand('config which', packageRoot)
    expect(error).to.equal(undefined)
    expect(stdout).to.contain('BROWSERBASE_API_KEY')
  })

  it('reports global file path', async () => {
    const gPath = path.join(xdg, 'zurf', 'config.json')
    await writeApiKeyConfig(gPath, 'gk')
    const {error, stdout} = await runCommand('config which', packageRoot)
    expect(error).to.equal(undefined)
    expect(stdout).to.contain(gPath)
  })

  it('exits 1 with JSON when none', async () => {
    const {error, stdout} = await runCommand('config which --json', packageRoot)
    expect(error).to.be.instanceOf(Error)
    const j = JSON.parse(stdout.trim())
    expect(j.source).to.equal('none')
  })
})
