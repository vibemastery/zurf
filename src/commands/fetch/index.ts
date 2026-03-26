import {Args, Flags} from '@oclif/core'
import * as fs from 'node:fs/promises'
import path from 'node:path'

import {cliError} from '../../lib/cli-errors.js'
import {resolveFormat} from '../../lib/config.js'
import {
  buildFetchJsonPayload,
  HUMAN_BODY_PREVIEW_CHARS,
  humanFetchMetaLines,
  truncateNote,
} from '../../lib/fetch-output.js'
import {zurfBaseFlags} from '../../lib/flags.js'
import {htmlToMarkdown} from '../../lib/html-to-markdown.js'
import {printJson} from '../../lib/json-output.js'
import {ZurfBrowserbaseCommand} from '../../lib/zurf-browserbase-command.js'

export default class Fetch extends ZurfBrowserbaseCommand {
  static args = {
    url: Args.string({
      description: 'URL to fetch',
      required: true,
    }),
  }
  static description = `Fetch a URL via Browserbase and return content as markdown (default) or raw HTML (no browser session; static HTML, 1 MB max).
Requires authentication. Run \`zurf init --global\` or use a project key before first use.`
  static examples = [
    '<%= config.bin %> <%= command.id %> https://example.com',
    '<%= config.bin %> <%= command.id %> https://example.com --html',
    '<%= config.bin %> <%= command.id %> https://example.com --json',
    '<%= config.bin %> <%= command.id %> https://example.com -o page.md --proxies',
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
  static summary = 'Fetch a URL via Browserbase and return content as markdown'

  async run(): Promise<void> {
    const {args, flags} = await this.parse(Fetch)
    const url = args.url.trim()

    let parsed: URL
    try {
      parsed = new URL(url)
    } catch {
      cliError({command: this, exitCode: 2, json: flags.json, message: `Invalid URL: ${url}`})
    }

    if (!['http:', 'https:'].includes(parsed.protocol)) {
      cliError({
        command: this,
        exitCode: 2,
        json: flags.json,
        message: `Only http and https URLs are supported: ${url}`,
      })
    }

    if (!parsed.hostname) {
      cliError({command: this, exitCode: 2, json: flags.json, message: `Invalid URL: ${url}`})
    }

    await this.runWithBrowserbase(flags, 'Fetching URL', async (client) => {
      const response = await client.fetchAPI.create({
        allowInsecureSsl: flags['allow-insecure-ssl'],
        allowRedirects: flags['allow-redirects'],
        proxies: flags.proxies,
        url,
      })

      const format = resolveFormat({flagHtml: flags.html, globalConfigDir: this.config.configDir})
      const content = format === 'markdown' ? await htmlToMarkdown(response.content) : response.content
      const converted = {...response, content}

      if (flags.json) {
        printJson(buildFetchJsonPayload(converted, format))
        return
      }

      this.logToStderr(humanFetchMetaLines(response).join('\n'))
      this.logToStderr('')

      if (flags.output) {
        try {
          await fs.writeFile(flags.output, content, 'utf8')
        } catch (error: unknown) {
          const code =
            error !== null &&
            typeof error === 'object' &&
            'code' in error &&
            typeof (error as {code?: unknown}).code === 'string'
              ? (error as {code: string}).code
              : undefined
          if (code === 'ENOENT') {
            cliError({
              command: this,
              exitCode: 1,
              json: flags.json,
              message: `Directory does not exist for output file: ${path.dirname(path.resolve(flags.output))}`,
            })
          }

          throw error
        }

        this.logToStderr(`Wrote content to ${flags.output}`)
        return
      }

      if (content.length <= HUMAN_BODY_PREVIEW_CHARS) {
        this.log(content)
        return
      }

      this.log(content.slice(0, HUMAN_BODY_PREVIEW_CHARS))
      this.log('')
      this.logToStderr(truncateNote(content.length))
    })
  }
}
