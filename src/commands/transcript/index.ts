import {Args, Command, Flags, ux} from '@oclif/core'
import * as fs from 'node:fs/promises'

import {cliError, errorMessage} from '../../lib/cli-errors.js'
import {zurfJsonFlag} from '../../lib/flags.js'
import {printJson} from '../../lib/json-output.js'
import {
  createSupadataClient,
  MissingSupadataKeyError,
  type SupadataTranscriptMode,
  type SupadataTranscriptResult,
  type SupadataTranscriptSegment,
} from '../../lib/supadata-client.js'

function formatTimestamp(offsetMs: number): string {
  const totalSeconds = Math.floor(offsetMs / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

function formatSegments(segments: SupadataTranscriptSegment[]): string {
  return segments.map((s) => `[${formatTimestamp(s.offset)}] ${s.text}`).join('\n')
}

export default class Transcript extends Command {
  static args = {
    url: Args.string({
      description: 'Video URL to get transcript from',
      required: true,
    }),
  }
  static description = `Fetch a video transcript from YouTube, TikTok, Instagram, X, Facebook, or a public file URL via Supadata.
Returns timestamped segments by default, or plain text with --text.`
  static examples = [
    '<%= config.bin %> <%= command.id %> https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    '<%= config.bin %> <%= command.id %> https://www.tiktok.com/@user/video/123 --text',
    '<%= config.bin %> <%= command.id %> https://www.youtube.com/watch?v=abc --lang en --mode native',
    '<%= config.bin %> <%= command.id %> https://www.youtube.com/watch?v=abc --output transcript.txt',
    '<%= config.bin %> <%= command.id %> https://www.youtube.com/watch?v=abc --json',
  ]
  static flags = {
    json: zurfJsonFlag,
    lang: Flags.string({description: 'Preferred language (ISO 639-1 code)'}),
    mode: Flags.option({
      default: 'auto' as const,
      description: 'Transcript mode: native (captions only), generate (AI), auto (try native first)',
      options: ['native', 'generate', 'auto'] as const,
    })(),
    output: Flags.string({char: 'o', description: 'Write transcript to this file'}),
    text: Flags.boolean({default: false, description: 'Return plain text instead of timestamped segments'}),
  }
  static summary = 'Fetch a video transcript via Supadata'

  async run(): Promise<void> {
    const {args, flags} = await this.parse(Transcript)

    let parsed: URL
    try {
      parsed = new URL(args.url)
    } catch {
      cliError({command: this, exitCode: 2, json: flags.json, message: `Invalid URL: ${args.url}`})
      return
    }

    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      cliError({command: this, exitCode: 2, json: flags.json, message: `URL must use http or https protocol, got ${parsed.protocol}`})
      return
    }

    let client
    try {
      ;({client} = createSupadataClient({globalConfigDir: this.config.configDir}))
    } catch (error) {
      if (error instanceof MissingSupadataKeyError) {
        cliError({command: this, exitCode: 1, json: flags.json, message: error.message})
      }

      throw error
    }

    const doWork = async (): Promise<SupadataTranscriptResult> => client.transcript({
      lang: flags.lang,
      mode: flags.mode as SupadataTranscriptMode,
      text: flags.text,
      url: args.url,
    })

    let result: SupadataTranscriptResult
    if (flags.json) {
      try {
        result = await doWork()
      } catch (error) {
        cliError({command: this, exitCode: 1, json: flags.json, message: errorMessage(error)})
        return
      }
    } else {
      ux.action.start('Fetching transcript')
      try {
        result = await doWork()
      } catch (error) {
        cliError({command: this, exitCode: 1, json: flags.json, message: errorMessage(error)})
        return
      } finally {
        ux.action.stop()
      }
    }

    // Output
    if (flags.json) {
      printJson({
        availableLangs: result.availableLangs,
        content: result.content,
        format: flags.text ? 'text' : 'segments',
        lang: result.lang,
        url: args.url,
      })
      return
    }

    const outputText = typeof result.content === 'string'
      ? result.content
      : formatSegments(result.content)

    if (flags.output) {
      await fs.writeFile(flags.output, outputText + '\n', 'utf8')
      this.log(`Transcript written to ${flags.output}`)
      return
    }

    // Human mode
    this.log(outputText)

    if (result.lang) {
      process.stderr.write(`Language: ${result.lang}\n`)
    }

    if (result.availableLangs.length > 0) {
      process.stderr.write(`Available languages: ${result.availableLangs.join(', ')}\n`)
    }
  }
}
