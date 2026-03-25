import {expect} from 'chai'
import path from 'node:path'

import {
  dotGitignoreMentionsZurf,
  ensureZurfGitignoreEntry,
  gitignorePathForCwd,
} from '../../src/lib/gitignore-zurf.js'

describe('gitignore-zurf', () => {
  it('dotGitignoreMentionsZurf detects common patterns', () => {
    expect(dotGitignoreMentionsZurf('.zurf/\n')).to.equal(true)
    expect(dotGitignoreMentionsZurf('foo\n.zurf\n')).to.equal(true)
    expect(dotGitignoreMentionsZurf('# .zurf\n')).to.equal(false)
    expect(dotGitignoreMentionsZurf('node_modules\n')).to.equal(false)
  })

  it('ensureZurfGitignoreEntry appends once', async () => {
    const fs = await import('node:fs/promises')
    const os = await import('node:os')
    const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'zurf-gi-'))
    const gi = path.join(tmp, '.gitignore')
    await ensureZurfGitignoreEntry(gi)
    await ensureZurfGitignoreEntry(gi)
    const content = await fs.readFile(gi, 'utf8')
    const matches = content.match(/\.zurf\//g)
    expect(matches?.length).to.equal(1)
  })

  it('gitignorePathForCwd joins cwd', () => {
    expect(gitignorePathForCwd('/tmp/proj')).to.match(/\.gitignore$/)
  })
})
