import {expect} from 'chai'
import * as fs from 'node:fs'
import * as os from 'node:os'
import path from 'node:path'

import {
  findLocalConfigPath,
  globalConfigPath,
  localConfigPathForCwd,
  resolveApiKey,
  whichApiKeySource,
  writeApiKeyConfig,
} from '../../src/lib/config.js'

describe('config', () => {
  let tmp: string
  let prevXdg: string | undefined
  let prevHome: string | undefined
  let prevBbKey: string | undefined

  beforeEach(() => {
    tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'zurf-cfg-'))
    prevXdg = process.env.XDG_CONFIG_HOME
    prevHome = process.env.HOME
    prevBbKey = process.env.BROWSERBASE_API_KEY
    process.env.XDG_CONFIG_HOME = path.join(tmp, 'xdg-config')
    process.env.HOME = tmp
    delete process.env.BROWSERBASE_API_KEY
  })

  afterEach(() => {
    fs.rmSync(tmp, {force: true, recursive: true})
    if (prevXdg === undefined) {
      delete process.env.XDG_CONFIG_HOME
    } else {
      process.env.XDG_CONFIG_HOME = prevXdg
    }

    if (prevHome === undefined) {
      delete process.env.HOME
    } else {
      process.env.HOME = prevHome
    }

    if (prevBbKey === undefined) {
      delete process.env.BROWSERBASE_API_KEY
    } else {
      process.env.BROWSERBASE_API_KEY = prevBbKey
    }
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
    await writeApiKeyConfig(path.join(zurfDir, 'config.json'), 'local-key')

    const g = globalConfigPath()
    await fs.promises.mkdir(path.dirname(g), {recursive: true})
    await writeApiKeyConfig(g, 'global-key')

    const r = resolveApiKey({cwd: proj})
    expect(r).to.deep.include({apiKey: 'local-key', source: 'local'})
  })

  it('findLocalConfigPath walks up to parent .zurf', async () => {
    const proj = path.join(tmp, 'repo')
    const nested = path.join(proj, 'apps', 'web')
    fs.mkdirSync(nested, {recursive: true})
    const zurfDir = path.join(proj, '.zurf')
    fs.mkdirSync(zurfDir, {recursive: true})
    await writeApiKeyConfig(path.join(zurfDir, 'config.json'), 'walk-up')

    const found = findLocalConfigPath(nested)
    expect(found).to.equal(path.join(zurfDir, 'config.json'))
    const r = resolveApiKey({cwd: nested})
    expect(r).to.deep.include({apiKey: 'walk-up', source: 'local'})
  })

  it('whichApiKeySource returns none when nothing set', () => {
    expect(whichApiKeySource({}).kind).to.equal('none')
  })

  it('localConfigPathForCwd joins .zurf/config.json', () => {
    const p = localConfigPathForCwd(path.join(tmp, 'myapp'))
    expect(p).to.equal(path.join(tmp, 'myapp', '.zurf', 'config.json'))
  })
})
