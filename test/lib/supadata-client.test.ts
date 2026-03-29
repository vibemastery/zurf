import {expect} from 'chai'
import * as fs from 'node:fs'
import * as os from 'node:os'
import path from 'node:path'

import {createSupadataClient, MissingSupadataKeyError} from '../../src/lib/supadata-client.js'
import {captureEnv, restoreEnv} from '../helpers/env-sandbox.js'

const ENV_KEYS = ['SUPADATA_API_KEY', 'XDG_CONFIG_HOME'] as const

describe('supadata-client', () => {
  let xdg: string
  let envSnapshot: Map<string, string | undefined>

  beforeEach(() => {
    envSnapshot = captureEnv(ENV_KEYS)
    xdg = fs.mkdtempSync(path.join(os.tmpdir(), 'zurf-sd-'))
    process.env.XDG_CONFIG_HOME = xdg
    delete process.env.SUPADATA_API_KEY
  })

  afterEach(() => {
    fs.rmSync(xdg, {force: true, recursive: true})
    restoreEnv(envSnapshot)
  })

  it('MissingSupadataKeyError has correct message and suggestions', () => {
    const err = new MissingSupadataKeyError()
    expect(err.message).to.equal('No Supadata API key found.')
    expect(err.name).to.equal('MissingSupadataKeyError')
    expect(err.code).to.equal('MISSING_SUPADATA_KEY')
    expect(err.suggestions).to.be.an('array').with.length(2)
  })

  it('createSupadataClient throws MissingSupadataKeyError when no key configured', () => {
    const globalConfigDir = path.join(xdg, 'zurf')
    expect(() => createSupadataClient({globalConfigDir})).to.throw(MissingSupadataKeyError)
  })

  it('createSupadataClient returns a client when env key is set', () => {
    process.env.SUPADATA_API_KEY = 'sd-test-key'
    const globalConfigDir = path.join(xdg, 'zurf')
    const {client, resolution} = createSupadataClient({globalConfigDir})
    expect(client).to.be.an('object')
    expect(resolution.source).to.equal('env')
    expect(resolution.apiKey).to.equal('sd-test-key')
  })
})
