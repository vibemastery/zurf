import type {Browserbase} from '@browserbasehq/sdk'
import type {Page} from 'playwright-core'

export async function withBrowserbaseSession<T>(options: {
  client: Browserbase
  projectId: string
  work: (page: Page) => Promise<T>
}): Promise<T> {
  const {chromium} = await import('playwright-core')
  const {client, projectId, work} = options

  const session = await client.sessions.create({projectId})
  const browser = await chromium.connectOverCDP(session.connectUrl)

  let cleanedUp = false
  const cleanup = async (): Promise<void> => {
    if (cleanedUp) return
    cleanedUp = true
    try {
      const pages = browser.contexts()[0]?.pages() ?? []
      await Promise.all(pages.map((p) => p.close().catch(() => {})))
      await browser.close().catch(() => {})
    } finally {
      await client.sessions.update(session.id, {status: 'REQUEST_RELEASE'}).catch(() => {})
    }
  }

  const onSignal = (): void => {
    // eslint-disable-next-line n/no-process-exit, unicorn/no-process-exit
    cleanup().then(() => process.exit(1), () => process.exit(1))
  }

  process.on('SIGINT', onSignal)
  process.on('SIGTERM', onSignal)

  try {
    const defaultContext = browser.contexts()[0]
    if (!defaultContext) {
      throw new Error('No browser context available from Browserbase session')
    }

    const page = defaultContext.pages()[0] ?? (await defaultContext.newPage())
    return await work(page)
  } finally {
    process.removeListener('SIGINT', onSignal)
    process.removeListener('SIGTERM', onSignal)
    await cleanup()
  }
}
