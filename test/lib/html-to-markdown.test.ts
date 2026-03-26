import {expect} from 'chai'

import {htmlToMarkdown} from '../../src/lib/html-to-markdown.js'

describe('htmlToMarkdown', () => {
  it('converts headings to atx style', async () => {
    const md = await htmlToMarkdown('<h1>Hello</h1>')
    expect(md).to.equal('# Hello')
  }).timeout(5000)

  it('strips script tags', async () => {
    const md = await htmlToMarkdown('<p>Keep</p><script>alert(1)</script>')
    expect(md).to.contain('Keep')
    expect(md).not.to.contain('alert')
  })

  it('strips style tags', async () => {
    const md = await htmlToMarkdown('<p>Visible</p><style>body{color:red}</style>')
    expect(md).to.contain('Visible')
    expect(md).not.to.contain('color:red')
  })

  it('strips iframe tags', async () => {
    const md = await htmlToMarkdown('<p>Text</p><iframe src="https://x.com"></iframe>')
    expect(md).to.contain('Text')
    expect(md).not.to.contain('iframe')
  })

  it('strips noscript tags', async () => {
    const md = await htmlToMarkdown('<p>Main</p><noscript>Fallback</noscript>')
    expect(md).to.contain('Main')
    expect(md).not.to.contain('Fallback')
  })

  it('preserves links as markdown', async () => {
    const md = await htmlToMarkdown('<a href="https://example.com">Example</a>')
    expect(md).to.equal('[Example](https://example.com)')
  })

  it('preserves images as markdown', async () => {
    const md = await htmlToMarkdown('<img alt="logo" src="logo.png">')
    expect(md).to.equal('![logo](logo.png)')
  })

  it('uses fenced code blocks', async () => {
    const md = await htmlToMarkdown('<pre><code>const x = 1</code></pre>')
    expect(md).to.contain('```')
    expect(md).to.contain('const x = 1')
  })
})
