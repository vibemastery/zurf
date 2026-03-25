import {runCommand} from '@oclif/test'
import {expect} from 'chai'
import * as fs from 'node:fs'
import * as os from 'node:os'
import path from 'node:path'
import {fileURLToPath} from 'node:url'

const packageRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..')

describe('search without API key', () => {
  let tmp: string
  let prevBb: string | undefined
  let prevXdg: string | undefined

  beforeEach(() => {
    tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'zurf-search-'))
    prevBb = process.env.BROWSERBASE_API_KEY
    prevXdg = process.env.XDG_CONFIG_HOME
    delete process.env.BROWSERBASE_API_KEY
    process.env.XDG_CONFIG_HOME = path.join(tmp, 'empty-xdg')
  })

  afterEach(() => {
    fs.rmSync(tmp, {force: true, recursive: true})
    if (prevBb === undefined) {
      delete process.env.BROWSERBASE_API_KEY
    } else {
      process.env.BROWSERBASE_API_KEY = prevBb
    }

    if (prevXdg === undefined) {
      delete process.env.XDG_CONFIG_HOME
    } else {
      process.env.XDG_CONFIG_HOME = prevXdg
    }
  })

  it('emits JSON error with --json', async () => {
    const {error, stdout} = await runCommand('search "test query" --json', packageRoot)
    expect(error).to.be.instanceOf(Error)
    const j = JSON.parse(stdout.trim())
    expect(j.error).to.have.property('message')
    expect(j.error.message as string).to.contain('API key')
  })
})
