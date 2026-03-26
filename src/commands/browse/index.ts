import {Args, Flags} from '@oclif/core'
import * as fs from 'node:fs/promises'
import path from 'node:path'

import {
  type BrowseJsonPayload,
  HUMAN_BODY_PREVIEW_CHARS,
  humanBrowseMetaLines,
  truncateNote,
} from '../../lib/browse-output.js'
import {withBrowserbaseSession} from '../../lib/browserbase-session.js'
import {cliError, errorCode} from '../../lib/cli-errors.js'
import {resolveProjectId} from '../../lib/config.js'
import {zurfBaseFlags} from '../../lib/flags.js'
import {printJson} from '../../lib/json-output.js'
import {ZurfBrowserbaseCommand} from '../../lib/zurf-browserbase-command.js'

export default class Browse extends ZurfBrowserbaseCommand {
  static args = {
    url: Args.string({
      description: 'URL to browse',
      required: true,
    }),
  }
  static description = `Browse a URL in a cloud browser and return the fully-rendered HTML.
Uses a real Chromium browser via Browserbase, so JavaScript-heavy pages are fully rendered.
Requires authentication and a Project ID. Run \`zurf init --global\` before first use.`
  static examples = [
    '<%= config.bin %> <%= command.id %> https://example.com',
    '<%= config.bin %> <%= command.id %> https://example.com --json',
    '<%= config.bin %> <%= command.id %> https://example.com -o page.html',
  ]
  static flags = {
    ...zurfBaseFlags,
    output: Flags.string({
      char: 'o',
      description: 'Write rendered HTML to this file (full content); otherwise human mode prints a truncated preview to stdout',
    }),
  }
  static summary = 'Browse a URL in a cloud browser and return rendered HTML'

  async run(): Promise<void> {
    const {args, flags} = await this.parse(Browse)
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

    await this.runWithBrowserbase(flags, `Browsing ${url}`, async (client) => {
      const resolution = resolveProjectId({globalConfigDir: this.config.configDir})
      if (resolution.source === 'none') {
        throw new Error(
          'No Browserbase Project ID found. Set BROWSERBASE_PROJECT_ID, run `zurf init --global` with --project-id, or add projectId to your .zurf/config.json.',
        )
      }

      const {projectId} = resolution

      const result = await withBrowserbaseSession({
        client,
        projectId,
        async work(page) {
          const response = await page.goto(url, {timeout: 30_000, waitUntil: 'networkidle'})
          const statusCode = response?.status() ?? null
          const content = await page.content()
          return {content, statusCode}
        },
      })

      if (flags.json) {
        const payload: BrowseJsonPayload = {content: result.content, statusCode: result.statusCode, url}
        printJson(payload)
        return
      }

      this.logToStderr(humanBrowseMetaLines({statusCode: result.statusCode, url}).join('\n'))
      this.logToStderr('')

      if (flags.output) {
        try {
          await fs.writeFile(flags.output, result.content, 'utf8')
        } catch (error: unknown) {
          if (errorCode(error) === 'ENOENT') {
            cliError({
              command: this,
              exitCode: 1,
              json: flags.json,
              message: `Directory does not exist for output file: ${path.dirname(path.resolve(flags.output))}`,
            })
          }

          throw error
        }

        this.logToStderr(`Wrote rendered HTML to ${flags.output}`)
        return
      }

      const {content} = result
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
