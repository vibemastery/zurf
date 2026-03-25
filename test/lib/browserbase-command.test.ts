import type {Command} from '@oclif/core'

import {expect} from 'chai'

import {getBrowserbaseClientOrExit} from '../../src/lib/browserbase-command.js'
import {CliJsonExitContractError} from '../../src/lib/cli-errors.js'

describe('getBrowserbaseClientOrExit', () => {
  it('throws CliJsonExitContractError when JSON mode and exit() does not throw', () => {
    const command = {
      error() {
        throw new Error('command.error should not run after JSON branch')
      },
      exit() {
        /* test double: real oclif throws */
      },
    } as unknown as Command

    expect(() => getBrowserbaseClientOrExit(command, {json: true})).to.throw(CliJsonExitContractError)
  })

  it('returns a client when API key is in env', () => {
    const prev = process.env.BROWSERBASE_API_KEY
    process.env.BROWSERBASE_API_KEY = 'test-key-for-client-init'
    try {
      const command = {error() {}, exit() {}} as unknown as Command
      const {client, resolution} = getBrowserbaseClientOrExit(command, {json: false})
      expect(resolution.source).to.equal('env')
      expect(client).to.have.property('search')
    } finally {
      if (prev === undefined) {
        delete process.env.BROWSERBASE_API_KEY
      } else {
        process.env.BROWSERBASE_API_KEY = prev
      }
    }
  })
})
