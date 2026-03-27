import {expect} from 'chai'
import * as fs from 'node:fs'
import * as os from 'node:os'
import path from 'node:path'

import {
  globalConfigFilePath,
  resolveProjectId,
  writeConfig,
} from '../../src/lib/config.js'
import {captureEnv, restoreEnv} from '../helpers/env-sandbox.js'

const ENV_KEYS = ['BROWSERBASE_PROJECT_ID', 'HOME', 'XDG_CONFIG_HOME'] as const

describe('resolveProjectId', () => {
  let tmp: string
  let envSnapshot: Map<string, string | undefined>
  let globalConfigDir: string

  beforeEach(() => {
    envSnapshot = captureEnv(ENV_KEYS)
    tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'zurf-pid-'))
    process.env.XDG_CONFIG_HOME = path.join(tmp, 'xdg-config')
    process.env.HOME = tmp
    delete process.env.BROWSERBASE_PROJECT_ID
    globalConfigDir = path.join(process.env.XDG_CONFIG_HOME, 'zurf')
  })

  afterEach(() => {
    fs.rmSync(tmp, {force: true, recursive: true})
    restoreEnv(envSnapshot)
  })

  it('uses BROWSERBASE_PROJECT_ID env var', () => {
    process.env.BROWSERBASE_PROJECT_ID = 'proj-from-env'
    const r = resolveProjectId({globalConfigDir})
    expect(r).to.deep.include({projectId: 'proj-from-env', source: 'env'})
  })

  it('uses local .zurf/config.json before global', async () => {
    const proj = path.join(tmp, 'proj')
    const zurfDir = path.join(proj, '.zurf')
    fs.mkdirSync(zurfDir, {recursive: true})
    const localFile = path.join(zurfDir, 'config.json')
    await writeConfig(localFile, {providers: {browserbase: {projectId: 'local-proj'}}})

    const g = globalConfigFilePath(globalConfigDir)
    await fs.promises.mkdir(path.dirname(g), {recursive: true})
    await writeConfig(g, {providers: {browserbase: {projectId: 'global-proj'}}})

    const r = resolveProjectId({cwd: proj, globalConfigDir})
    expect(r).to.deep.include({path: localFile, projectId: 'local-proj', source: 'local'})
  })

  it('uses global config when no local exists', async () => {
    const g = globalConfigFilePath(globalConfigDir)
    await fs.promises.mkdir(path.dirname(g), {recursive: true})
    await writeConfig(g, {providers: {browserbase: {projectId: 'gp'}}})
    const r = resolveProjectId({cwd: tmp, globalConfigDir})
    expect(r).to.deep.include({projectId: 'gp', source: 'global'})
  })

  it('returns none when nothing set', () => {
    expect(resolveProjectId({cwd: tmp, globalConfigDir}).source).to.equal('none')
  })

  it('auto-migrates old flat shape with projectId', async () => {
    const g = globalConfigFilePath(globalConfigDir)
    await fs.promises.mkdir(path.dirname(g), {recursive: true})
    // Write old flat shape directly
    fs.writeFileSync(g, JSON.stringify({apiKey: 'old-key', projectId: 'old-proj'}), 'utf8')
    const r = resolveProjectId({cwd: tmp, globalConfigDir})
    expect(r).to.deep.include({projectId: 'old-proj', source: 'global'})
  })
})
