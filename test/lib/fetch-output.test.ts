import {expect} from 'chai'

import {
  buildFetchJsonPayload,
  HUMAN_BODY_PREVIEW_CHARS,
  humanFetchMetaLines,
  truncateNote,
} from '../../src/lib/fetch-output.js'

describe('fetch-output', () => {
  const sample = {
    content: '<html/>',
    contentType: 'text/html',
    encoding: 'utf8',
    headers: {'x-a': '1'},
    id: 'f1',
    statusCode: 200,
  }

  it('buildFetchJsonPayload mirrors response fields', () => {
    expect(buildFetchJsonPayload(sample)).to.deep.equal(sample)
  })

  it('humanFetchMetaLines includes id and status', () => {
    expect(humanFetchMetaLines(sample).join('\n')).to.contain('id: f1')
    expect(humanFetchMetaLines(sample).join('\n')).to.contain('statusCode: 200')
  })

  it('truncateNote mentions length and --output', () => {
    expect(truncateNote(99_000)).to.contain('99')
    expect(truncateNote(99_000)).to.contain('--output')
  })

  it('HUMAN_BODY_PREVIEW_CHARS is a reasonable preview size', () => {
    expect(HUMAN_BODY_PREVIEW_CHARS).to.equal(8000)
  })
})
