export type SearchResultRow = {author?: string; title: string; url: string}

export type SearchResponseForDisplay = {
  query: string
  requestId: string
  results: SearchResultRow[]
}

export function buildSearchJsonPayload(response: SearchResponseForDisplay): {
  query: string
  requestId: string
  results: SearchResultRow[]
} {
  return {
    query: response.query,
    requestId: response.requestId,
    results: response.results,
  }
}

export function linesForHumanSearch(response: SearchResponseForDisplay): string[] {
  const lines: string[] = [`requestId: ${response.requestId}`, '']
  for (const [i, r] of response.results.entries()) {
    const block = [
      `${i + 1}. ${r.title}`,
      `   ${r.url}`,
      ...(r.author ? [`   author: ${r.author}`] : []),
      '',
    ]
    lines.push(...block)
  }

  return lines
}
