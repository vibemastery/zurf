import {expect} from 'chai'
import * as fs from 'node:fs'
import * as os from 'node:os'
import path from 'node:path'

import {
  findLocalConfigPath,
  globalConfigPath,
  localConfigPathForCwd,
  resolveApiKey,
  writeApiKeyConfig,
} from '../../src/lib/config.js'
import {captureEnv, restoreEnv} from '../helpers/env-sandbox.js'

const ENV_KEYS = ['BROWSERBASE_API_KEY', 'HOME', 'XDG_CONFIG_HOME'] as const

describe('config', () => {
  let tmp: string
  let envSnapshot: Map<string, string | undefined>

  beforeEach(() => {
    envSnapshot = captureEnv(ENV_KEYS)
    tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'zurf-cfg-'))
    process.env.XDG_CONFIG_HOME = path.join(tmp, 'xdg-config')
    process.env.HOME = tmp
    delete process.env.BROWSERBASE_API_KEY
  })

  afterEach(() => {
    fs.rmSync(tmp, {force: true, recursive: true})
    restoreEnv(envSnapshot)
  })

  it('resolveApiKey uses flag over env', () => {
    process.env.BROWSERBASE_API_KEY = 'from-env'
    const r = resolveApiKey({flagKey: 'from-flag'})
    expect(r).to.deep.include({apiKey: 'from-flag', source: 'flag'})
  })

  it('resolveApiKey uses env when no flag', () => {
    process.env.BROWSERBASE_API_KEY = 'from-env'
    const r = resolveApiKey({})
    expect(r).to.deep.include({apiKey: 'from-env', source: 'env'})
  })

  it('resolveApiKey uses local .zurf/config.json before global', async () => {
    const proj = path.join(tmp, 'proj')
    const zurfDir = path.join(proj, '.zurf')
    fs.mkdirSync(zurfDir, {recursive: true})
    const localFile = path.join(zurfDir, 'config.json')
    await writeApiKeyConfig(localFile, 'local-key')

    const g = globalConfigPath()
    await fs.promises.mkdir(path.dirname(g), {recursive: true})
    await writeApiKeyConfig(g, 'global-key')

    const r = resolveApiKey({cwd: proj})
    expect(r).to.deep.include({apiKey: 'local-key', path: localFile, source: 'local'})
  })

  it('findLocalConfigPath walks up to parent .zurf', async () => {
    const proj = path.join(tmp, 'repo')
    const nested = path.join(proj, 'apps', 'web')
    fs.mkdirSync(nested, {recursive: true})
    const zurfDir = path.join(proj, '.zurf')
    fs.mkdirSync(zurfDir, {recursive: true})
    const localFile = path.join(zurfDir, 'config.json')
    await writeApiKeyConfig(localFile, 'walk-up')

    const found = findLocalConfigPath(nested)
    expect(found).to.equal(localFile)
    const r = resolveApiKey({cwd: nested})
    expect(r).to.deep.include({apiKey: 'walk-up', path: localFile, source: 'local'})
  })

  it('resolveApiKey returns none when nothing set', () => {
    expect(resolveApiKey({}).source).to.equal('none')
  })

  it('resolveApiKey returns global with path when global file has key', async () => {
    const g = globalConfigPath()
    await fs.promises.mkdir(path.dirname(g), {recursive: true})
    await writeApiKeyConfig(g, 'gk')
    const resolved = resolveApiKey({})
    expect(resolved.source).to.equal('global')
    if (resolved.source === 'global') {
      expect(resolved.path).to.equal(g)
      expect(resolved.apiKey).to.equal('gk')
    }
  })

  it('localConfigPathForCwd joins .zurf/config.json', () => {
    const p = localConfigPathForCwd(path.join(tmp, 'myapp'))
    expect(p).to.equal(path.join(tmp, 'myapp', '.zurf', 'config.json'))
  })
})
