import type TurndownService from 'turndown'

let cached: TurndownService | undefined

async function getService(): Promise<TurndownService> {
  if (cached) return cached

  const {default: Turndown} = await import('turndown')
  const service = new Turndown({
    codeBlockStyle: 'fenced',
    headingStyle: 'atx',
  })

  service.remove(['script', 'style', 'iframe', 'noscript'])
  service.addRule('remove-svg', {
    filter: (node) => node.nodeName.toLowerCase() === 'svg',
    replacement: () => '',
  })

  cached = service
  return service
}

export async function htmlToMarkdown(html: string): Promise<string> {
  const service = await getService()
  return service.turndown(html)
}
