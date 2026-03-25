import {Args, Command, Flags} from '@oclif/core'
import * as fs from 'node:fs/promises'

import {createBrowserbaseClient, MissingApiKeyError} from '../../lib/browserbase-client.js'
import {errorMessage, errorStatus} from '../../lib/cli-errors.js'
import {zurfBaseFlags} from '../../lib/flags.js'
import {printErrorJson, printJson} from '../../lib/json-output.js'

const HUMAN_BODY_PREVIEW_CHARS = 8000

export default class Fetch extends Command {
  static args = {
    url: Args.string({
      description: 'URL to fetch',
      required: true,
    }),
  }
  static description = 'Fetch a URL via Browserbase (no browser session; static HTML, 1 MB max)'
  static examples = [
    '<%= config.bin %> <%= command.id %> https://example.com',
    '<%= config.bin %> <%= command.id %> https://example.com --json',
    '<%= config.bin %> <%= command.id %> https://example.com -o page.html --proxies',
  ]
  static flags = {
    ...zurfBaseFlags,
    'allow-insecure-ssl': Flags.boolean({
      default: false,
      description: 'Disable TLS certificate verification (use only if you trust the target)',
    }),
    'allow-redirects': Flags.boolean({
      default: false,
      description: 'Follow HTTP redirects',
    }),
    output: Flags.string({
      char: 'o',
      description: 'Write response body to this file (full content); otherwise human mode prints a truncated preview to stdout',
    }),
    proxies: Flags.boolean({
      default: false,
      description: 'Route through Browserbase proxies (helps with some blocked sites)',
    }),
  }

  async run(): Promise<void> {
    const {args, flags} = await this.parse(Fetch)
    const url = args.url.trim()

    if (url.length === 0) {
      if (flags.json) {
        printErrorJson('URL must not be empty.')
        this.exit(2)
      }

      this.error('URL must not be empty.')
    }

    let client
    try {
      ;({client} = createBrowserbaseClient({flagKey: flags['api-key']}))
    } catch (error) {
      if (error instanceof MissingApiKeyError) {
        if (flags.json) {
          printErrorJson(error.message)
          this.exit(2)
        }

        this.error(error.message, {exit: 2})
      }

      throw error
    }

    try {
      const response = await client.fetchAPI.create({
        allowInsecureSsl: flags['allow-insecure-ssl'],
        allowRedirects: flags['allow-redirects'],
        proxies: flags.proxies,
        url,
      })

      if (flags.json) {
        printJson({
          content: response.content,
          contentType: response.contentType,
          encoding: response.encoding,
          headers: response.headers,
          id: response.id,
          statusCode: response.statusCode,
        })
        return
      }

      const meta = [
        `id: ${response.id}`,
        `statusCode: ${response.statusCode}`,
        `contentType: ${response.contentType}`,
        `encoding: ${response.encoding}`,
      ].join('\n')

      this.logToStderr(meta)
      this.logToStderr('')

      if (flags.output) {
        await fs.writeFile(flags.output, response.content, 'utf8')
        this.logToStderr(`Wrote body to ${flags.output}`)
        return
      }

      const {content} = response
      if (content.length <= HUMAN_BODY_PREVIEW_CHARS) {
        this.log(content)
        return
      }

      this.log(content.slice(0, HUMAN_BODY_PREVIEW_CHARS))
      this.log('')
      this.logToStderr(
        `… truncated (${content.length} chars). Use --output FILE to save the full body (within the 1 MB Fetch limit).`,
      )
    } catch (error) {
      if (flags.json) {
        printErrorJson(errorMessage(error), errorStatus(error))
        this.exit(1)
      }

      this.error(errorMessage(error), {exit: 1})
    }
  }
}
