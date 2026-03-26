export type FetchResponseForDisplay = {
  content: string
  contentType: string
  encoding: string
  headers: Record<string, string>
  id: string
  statusCode: number
}

export function buildFetchJsonPayload(response: FetchResponseForDisplay, format: 'html' | 'markdown'): {
  content: string
  contentType: string
  encoding: string
  format: 'html' | 'markdown'
  headers: Record<string, string>
  id: string
  statusCode: number
} {
  return {
    content: response.content,
    contentType: response.contentType,
    encoding: response.encoding,
    format,
    headers: response.headers,
    id: response.id,
    statusCode: response.statusCode,
  }
}

export function humanFetchMetaLines(response: FetchResponseForDisplay): string[] {
  return [
    `id: ${response.id}`,
    `statusCode: ${response.statusCode}`,
    `contentType: ${response.contentType}`,
    `encoding: ${response.encoding}`,
  ]
}

/** ~8k chars keeps terminal scrollback usable while showing most HTML pages in preview. */
export const HUMAN_BODY_PREVIEW_CHARS = 8000

export function truncateNote(totalChars: number): string {
  return `… truncated (${totalChars} chars). Use --output FILE to save the full content (within the 1 MB Fetch limit).`
}
