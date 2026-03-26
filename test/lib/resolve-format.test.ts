import {expect} from 'chai'
import * as fs from 'node:fs'
import * as os from 'node:os'
import path from 'node:path'

import {resolveFormat, writeConfig} from '../../src/lib/config.js'
import {captureEnv, restoreEnv} from '../helpers/env-sandbox.js'

const ENV_KEYS = ['ZURF_HTML', 'HOME', 'XDG_CONFIG_HOME'] as const

describe('resolveFormat', () => {
  let tmp: string
  let envSnapshot: Map<string, string | undefined>
  let globalConfigDir: string

  beforeEach(() => {
    envSnapshot = captureEnv(ENV_KEYS)
    tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'zurf-fmt-'))
    process.env.XDG_CONFIG_HOME = path.join(tmp, 'xdg-config')
    process.env.HOME = tmp
    delete process.env.ZURF_HTML
    globalConfigDir = path.join(process.env.XDG_CONFIG_HOME, 'zurf')
  })

  afterEach(() => {
    fs.rmSync(tmp, {force: true, recursive: true})
    restoreEnv(envSnapshot)
  })

  it('defaults to markdown when nothing is set', () => {
    const fmt = resolveFormat({flagHtml: false, globalConfigDir})
    expect(fmt).to.equal('markdown')
  })

  it('returns html when --html flag is true', () => {
    const fmt = resolveFormat({flagHtml: true, globalConfigDir})
    expect(fmt).to.equal('html')
  })

  it('returns html when ZURF_HTML env is "true"', () => {
    process.env.ZURF_HTML = 'true'
    const fmt = resolveFormat({flagHtml: false, globalConfigDir})
    expect(fmt).to.equal('html')
  })

  it('returns html when ZURF_HTML env is "1"', () => {
    process.env.ZURF_HTML = '1'
    const fmt = resolveFormat({flagHtml: false, globalConfigDir})
    expect(fmt).to.equal('html')
  })

  it('returns html from local config file', async () => {
    const proj = path.join(tmp, 'proj')
    const zurfDir = path.join(proj, '.zurf')
    fs.mkdirSync(zurfDir, {recursive: true})
    await writeConfig(path.join(zurfDir, 'config.json'), {format: 'html'})

    const fmt = resolveFormat({cwd: proj, flagHtml: false, globalConfigDir})
    expect(fmt).to.equal('html')
  })

  it('returns html from global config file', async () => {
    fs.mkdirSync(globalConfigDir, {recursive: true})
    await writeConfig(path.join(globalConfigDir, 'config.json'), {format: 'html'})

    const fmt = resolveFormat({flagHtml: false, globalConfigDir})
    expect(fmt).to.equal('html')
  })

  it('flag takes priority over env', () => {
    process.env.ZURF_HTML = 'false'
    const fmt = resolveFormat({flagHtml: true, globalConfigDir})
    expect(fmt).to.equal('html')
  })

  it('local config takes priority over global config', async () => {
    const proj = path.join(tmp, 'proj')
    const zurfDir = path.join(proj, '.zurf')
    fs.mkdirSync(zurfDir, {recursive: true})
    await writeConfig(path.join(zurfDir, 'config.json'), {format: 'markdown'})

    fs.mkdirSync(globalConfigDir, {recursive: true})
    await writeConfig(path.join(globalConfigDir, 'config.json'), {format: 'html'})

    const fmt = resolveFormat({cwd: proj, flagHtml: false, globalConfigDir})
    expect(fmt).to.equal('markdown')
  })
})
