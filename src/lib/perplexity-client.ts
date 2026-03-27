import {resolvePerplexityApiKey} from './config.js'

export type PerplexityDepth = 'deep' | 'quick'
export type PerplexityRecency = 'day' | 'hour' | 'month' | 'week' | 'year'

export interface PerplexityAskOptions {
  depth?: PerplexityDepth
  domains?: string[]
  question: string
  recency?: PerplexityRecency
}

export interface PerplexityAskResult {
  answer: string
  citations: string[]
  model: string
}

interface PerplexityMessage {
  content: string
  role: string
}

interface PerplexityResponse {
  choices: Array<{message: PerplexityMessage}>
  citations?: string[]
  model: string
}

/* eslint-disable n/no-unsupported-features/node-builtins -- fetch is stable in Node 18 LTS; the lint rule lags behind */

interface PerplexityRequestBody {
  messages: Array<{content: string; role: string}>
  model: string
  search_domain_filter?: string[]
  search_recency_filter?: string
}

function buildRequestBody(options: PerplexityAskOptions): PerplexityRequestBody {
  const model = options.depth === 'deep' ? 'sonar-pro' : 'sonar'
  const body: PerplexityRequestBody = {
    messages: [{content: options.question, role: 'user'}],
    model,
  }

  if (options.recency) {
    body.search_recency_filter = options.recency // eslint-disable-line camelcase
  }

  if (options.domains && options.domains.length > 0) {
    body.search_domain_filter = options.domains // eslint-disable-line camelcase
  }

  return body
}

export class PerplexityClient {
  constructor(private readonly apiKey: string) {}

  async ask(options: PerplexityAskOptions): Promise<PerplexityAskResult> {
    const body = buildRequestBody(options)

    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      body: JSON.stringify(body),
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      method: 'POST',
    })

    if (!response.ok) {
      const text = await response.text().catch(() => '')
      throw new Error(`Perplexity API error (${response.status}): ${text || response.statusText}`)
    }

    const data = (await response.json()) as PerplexityResponse
    const answer = data.choices?.[0]?.message?.content ?? ''
    const citations = data.citations ?? []

    return {answer, citations, model: data.model}
  }
}

export class MissingPerplexityKeyError extends Error {
  code = 'MISSING_PERPLEXITY_KEY'
  suggestions = [
    'Run `zurf setup` to configure your Perplexity API key',
    'Or set the PERPLEXITY_API_KEY environment variable',
  ]

  constructor() {
    super('No Perplexity API key found.')
    this.name = 'MissingPerplexityKeyError'
  }
}

export function createPerplexityClient(options: {
  cwd?: string
  globalConfigDir: string
}): {client: PerplexityClient; resolution: Extract<ReturnType<typeof resolvePerplexityApiKey>, {apiKey: string}>} {
  const resolution = resolvePerplexityApiKey({cwd: options.cwd, globalConfigDir: options.globalConfigDir})

  if (resolution.source === 'none') {
    throw new MissingPerplexityKeyError()
  }

  const client = new PerplexityClient(resolution.apiKey)
  return {client, resolution}
}
