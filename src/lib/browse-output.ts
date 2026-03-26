export interface BrowseJsonPayload {
  content: string
  statusCode: null | number
  url: string
}

export function humanBrowseMetaLines(options: {statusCode: null | number; url: string}): string[] {
  return [
    `url: ${options.url}`,
    `statusCode: ${options.statusCode ?? 'unknown'}`,
  ]
}

export const HUMAN_BODY_PREVIEW_CHARS = 8000

export function truncateNote(totalChars: number): string {
  return `… truncated (${totalChars} chars). Use --output FILE to save the full rendered HTML.`
}
