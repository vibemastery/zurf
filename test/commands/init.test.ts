import {runCommand} from '@oclif/test'
import {expect} from 'chai'
import * as fs from 'node:fs'
import * as os from 'node:os'
import path from 'node:path'
import {fileURLToPath} from 'node:url'

import {captureEnv, restoreEnv} from '../helpers/env-sandbox.js'

const packageRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..')
const ENV_KEYS = ['BROWSERBASE_API_KEY', 'XDG_CONFIG_HOME'] as const

describe('init', () => {
  let xdg: string
  let cwd: string
  let prevCwd: string
  let envSnapshot: Map<string, string | undefined>

  beforeEach(() => {
    envSnapshot = captureEnv(ENV_KEYS)
    xdg = fs.mkdtempSync(path.join(os.tmpdir(), 'zurf-init-xdg-'))
    cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'zurf-init-cwd-'))
    process.env.XDG_CONFIG_HOME = xdg
    prevCwd = process.cwd()
    process.chdir(cwd)
    delete process.env.BROWSERBASE_API_KEY
  })

  afterEach(() => {
    process.chdir(prevCwd)
    fs.rmSync(xdg, {force: true, recursive: true})
    fs.rmSync(cwd, {force: true, recursive: true})
    restoreEnv(envSnapshot)
  })

  it('writes global config under XDG_CONFIG_HOME', async () => {
    const {error, stdout} = await runCommand('init --global --api-key bb_init_global', packageRoot)
    expect(error).to.equal(undefined)
    expect(stdout).to.contain('Saved API key')
    const cfgPath = path.join(xdg, 'zurf', 'config.json')
    const raw = JSON.parse(fs.readFileSync(cfgPath, 'utf8'))
    expect(raw.apiKey).to.equal('bb_init_global')
  })

  it('writes local .zurf/config.json', async () => {
    const {error} = await runCommand('init --local --api-key bb_init_local', packageRoot)
    expect(error).to.equal(undefined)
    const cfgPath = path.join(cwd, '.zurf', 'config.json')
    const raw = JSON.parse(fs.readFileSync(cfgPath, 'utf8'))
    expect(raw.apiKey).to.equal('bb_init_local')
  })

  it('prints JSON with --json', async () => {
    const {error, stdout} = await runCommand('init --global --api-key bb_json --json', packageRoot)
    expect(error).to.equal(undefined)
    const j = JSON.parse(stdout.trim())
    expect(j.ok).to.equal(true)
    expect(j.scope).to.equal('global')
    expect(j.path).to.equal(path.join(xdg, 'zurf', 'config.json'))
  })
})
