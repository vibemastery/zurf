import {resolveSupadataApiKey} from './config.js'

/* eslint-disable n/no-unsupported-features/node-builtins -- fetch is stable in Node 18 LTS */

export type SupadataTranscriptMode = 'auto' | 'generate' | 'native'

export interface SupadataTranscriptOptions {
  lang?: string
  mode?: SupadataTranscriptMode
  text?: boolean
  url: string
}

export interface SupadataTranscriptSegment {
  duration: number
  lang: string
  offset: number
  text: string
}

export interface SupadataTranscriptResult {
  availableLangs: string[]
  content: string | SupadataTranscriptSegment[]
  lang: string
}

type SupadataJobStatus = 'active' | 'completed' | 'failed' | 'queued'

interface SupadataJobResponse {
  availableLangs?: string[]
  content?: string | SupadataTranscriptSegment[]
  error?: string
  lang?: string
  status: SupadataJobStatus
}

const MAX_POLL_ATTEMPTS = 120

export class SupadataClient {
  constructor(private readonly apiKey: string) {}

  async transcript(options: SupadataTranscriptOptions): Promise<SupadataTranscriptResult> {
    const params = new URLSearchParams({url: options.url})
    if (options.lang) params.set('lang', options.lang)
    if (options.text !== undefined) params.set('text', String(options.text))
    if (options.mode) params.set('mode', options.mode)

    const response = await fetch(`https://api.supadata.ai/v1/transcript?${params.toString()}`, {
      headers: {'x-api-key': this.apiKey},
      method: 'GET',
    })

    if (response.status === 202) {
      const body = (await response.json()) as {jobId: string}
      return this.pollJob(body.jobId)
    }

    if (response.status === 401) {
      throw new Error('Supadata API error (401): Invalid or missing API key.')
    }

    if (response.status === 402) {
      throw new Error('Supadata API error (402): Insufficient credits or payment required.')
    }

    if (response.status === 429) {
      throw new Error('Supadata API error (429): Rate limit exceeded. Please wait and try again.')
    }

    if (!response.ok) {
      const text = await response.text().catch(() => '')
      throw new Error(`Supadata API error (${response.status}): ${text || response.statusText}`)
    }

    const data = (await response.json()) as SupadataTranscriptResult
    return data
  }

  private async pollJob(jobId: string): Promise<SupadataTranscriptResult> {
    for (let attempt = 0; attempt < MAX_POLL_ATTEMPTS; attempt++) {
      const response = await fetch(`https://api.supadata.ai/v1/transcript/${jobId}`, { // eslint-disable-line no-await-in-loop -- sequential polling by design
        headers: {'x-api-key': this.apiKey},
        method: 'GET',
      })

      if (!response.ok) {
        const text = await response.text().catch(() => '') // eslint-disable-line no-await-in-loop
        throw new Error(`Supadata job poll error (${response.status}): ${text || response.statusText}`)
      }

      // eslint-disable-next-line no-await-in-loop
      const data = (await response.json()) as SupadataJobResponse

      if (data.status === 'completed') {
        return {
          availableLangs: data.availableLangs ?? [],
          content: data.content ?? '',
          lang: data.lang ?? '',
        }
      }

      if (data.status === 'failed') {
        throw new Error(`Supadata transcript job failed: ${data.error ?? 'unknown error'}`)
      }

      // eslint-disable-next-line no-await-in-loop
      await new Promise((resolve) => {
        setTimeout(resolve, 1000)
      })
    }

    throw new Error(`Supadata transcript job timed out after ${MAX_POLL_ATTEMPTS} seconds.`)
  }
}

export class MissingSupadataKeyError extends Error {
  code = 'MISSING_SUPADATA_KEY'
  suggestions = [
    'Run `zurf setup` to configure your Supadata API key',
    'Or set the SUPADATA_API_KEY environment variable',
  ]

  constructor() {
    super('No Supadata API key found.')
    this.name = 'MissingSupadataKeyError'
  }
}

export function createSupadataClient(options: {
  cwd?: string
  globalConfigDir: string
}): {client: SupadataClient; resolution: Extract<ReturnType<typeof resolveSupadataApiKey>, {apiKey: string}>} {
  const resolution = resolveSupadataApiKey({cwd: options.cwd, globalConfigDir: options.globalConfigDir})

  if (resolution.source === 'none') {
    throw new MissingSupadataKeyError()
  }

  const client = new SupadataClient(resolution.apiKey)
  return {client, resolution}
}
