import * as fs from 'node:fs/promises'
import path from 'node:path'

/** True if `.gitignore` content already mentions ignoring zurf's local config dir. */
export function dotGitignoreMentionsZurf(content: string): boolean {
  for (const line of content.split(/\r?\n/)) {
    const t = line.trim()
    if (t === '' || t.startsWith('#')) {
      continue
    }

    if (t === '.zurf' || t === '.zurf/') {
      return true
    }

    if (t.endsWith('/.zurf') || t.endsWith('/.zurf/')) {
      return true
    }
  }

  return false
}

const BLOCK = '\n# zurf local API key\n.zurf/\n'

/** Append a `.zurf/` block to `gitignorePath` when missing. No-op if already present. */
export async function ensureZurfGitignoreEntry(gitignorePath: string): Promise<void> {
  let existing = ''
  try {
    existing = await fs.readFile(gitignorePath, 'utf8')
  } catch (error: unknown) {
    const code =
      error !== null &&
      typeof error === 'object' &&
      'code' in error &&
      typeof (error as {code?: unknown}).code === 'string'
        ? (error as {code: string}).code
        : undefined
    if (code !== 'ENOENT') {
      throw error
    }
  }

  if (dotGitignoreMentionsZurf(existing)) {
    return
  }

  const prefix = existing.length > 0 && !existing.endsWith('\n') ? '\n' : ''
  await fs.writeFile(gitignorePath, `${existing}${prefix}${BLOCK}`, 'utf8')
}

export function gitignorePathForCwd(cwd: string = process.cwd()): string {
  return path.join(path.resolve(cwd), '.gitignore')
}
