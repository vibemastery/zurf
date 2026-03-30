import {tavily} from '@tavily/core'

import {type ResolvedApiKey, findLocalConfigPath, globalConfigFilePath, readConfigFile} from './config.js'
import type {PerplexityAskResult} from './perplexity-client.js'

export interface TavilyAskOptions {
  domains?: string[]
  question: string
  recency?: string
}

export class MissingTavilyKeyError extends Error {
  code = 'MISSING_TAVILY_KEY'
  suggestions = [
    'Run `zurf setup` to configure your Tavily API key',
    'Or set the TAVILY_API_KEY environment variable',
  ]

  constructor() {
    super('No Tavily API key found.')
    this.name = 'MissingTavilyKeyError'
  }
}

const readTavilyApiKeyFromFile = (filePath: string): string | undefined => {
  const parsed = readConfigFile(filePath)
  if (!parsed) return undefined
  const val = parsed.providers?.tavily?.apiKey?.trim() ?? ''
  return val.length > 0 ? val : undefined
}

export function resolveTavilyApiKey(options: {cwd?: string; globalConfigDir: string}): ResolvedApiKey {
  const cwd = options.cwd ?? process.cwd()

  const envKey = process.env.TAVILY_API_KEY?.trim()
  if (envKey) {
    return {apiKey: envKey, source: 'env'}
  }

  const localPath = findLocalConfigPath(cwd)
  if (localPath) {
    const key = readTavilyApiKeyFromFile(localPath)
    if (key) {
      return {apiKey: key, path: localPath, source: 'local'}
    }
  }

  const gPath = globalConfigFilePath(options.globalConfigDir)
  const globalKey = readTavilyApiKeyFromFile(gPath)
  if (globalKey) {
    return {apiKey: globalKey, path: gPath, source: 'global'}
  }

  return {source: 'none'}
}

const RECENCY_TO_TIME_RANGE: Record<string, string> = {
  day: 'day',
  hour: 'day',
  month: 'month',
  week: 'week',
  year: 'year',
}

export class TavilyAskClient {
  private readonly apiKey: string

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  async ask(options: TavilyAskOptions): Promise<PerplexityAskResult> {
    const client = tavily({apiKey: this.apiKey})

    const searchOptions: Record<string, unknown> = {
      includeAnswer: true,
      maxResults: 5,
      searchDepth: 'advanced' as const,
    }

    if (options.recency && RECENCY_TO_TIME_RANGE[options.recency]) {
      searchOptions.timeRange = RECENCY_TO_TIME_RANGE[options.recency]
    }

    if (options.domains && options.domains.length > 0) {
      searchOptions.includeDomains = options.domains
    }

    const response = await client.search(options.question, searchOptions)

    const answer = response.answer ?? ''
    const citations = response.results.map((r: {url: string}) => r.url)

    return {answer, citations, model: 'tavily'}
  }
}

export function createTavilyAskClient(options: {
  cwd?: string
  globalConfigDir: string
}): {client: TavilyAskClient; resolution: Extract<ResolvedApiKey, {apiKey: string}>} {
  const resolution = resolveTavilyApiKey({cwd: options.cwd, globalConfigDir: options.globalConfigDir})

  if (resolution.source === 'none') {
    throw new MissingTavilyKeyError()
  }

  const client = new TavilyAskClient(resolution.apiKey)
  return {client, resolution}
}
