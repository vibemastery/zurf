import {expect} from 'chai'

import {buildSearchJsonPayload, linesForHumanSearch} from '../../src/lib/search-output.js'

describe('search-output', () => {
  const sample = {
    query: 'q',
    requestId: 'req-1',
    results: [
      {author: 'A', title: 'T', url: 'https://a.test'},
      {title: 'U', url: 'https://b.test'},
    ],
  }

  it('buildSearchJsonPayload mirrors response fields', () => {
    expect(buildSearchJsonPayload(sample)).to.deep.equal({
      query: 'q',
      requestId: 'req-1',
      results: sample.results,
    })
  })

  it('linesForHumanSearch formats numbered results', () => {
    const lines = linesForHumanSearch(sample)
    expect(lines[0]).to.equal('requestId: req-1')
    expect(lines).to.include('1. T')
    expect(lines).to.include('   https://a.test')
    expect(lines).to.include('   author: A')
    expect(lines).to.include('2. U')
  })
})
