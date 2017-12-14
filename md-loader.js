'use strict'

const marked = require('marked')
const hljs = require('highlight.js')

marked.setOptions({
  smartypants: true,
  highlight: (code, lang) => (
    lang ? hljs.highlight(lang, code) : hljs.highlightAuto(code)
  ).value,
})

// Adds anchor links.
marked.Renderer.prototype.heading = function heading(text, level, raw) {
  const id = this.options.headerPrefix + raw.toLowerCase().replace(/[^\w]+/g, '-')
  return (
`<h${level} id="${id}">
  <span>${text}</span>
  <a class="heading-anchor fa fa-link" href="#${id}"></a>
</h${level}>`
  )
}

// Adds target="_blank" to external links.
marked.Renderer.prototype.link = function link(href, title, text) {
  if (this.options.sanitize) {
    try {
      const protocol = decodeURIComponent(unescape(href))
        .replace(/[^\w:]/g, '')
        .toLowerCase()
      if (/javascript:|vbscript:/i.test(protocol)) return ''
    }
    catch (err) {
      console.error(err)
      return ''
    }
  }

  // The site is mounted on a base href. Links starting with / are usually
  // typos. Links starting with // are a stupid idea anyway and need a protocol
  // prepended.
  if (/^\//.test(href)) {
    throw Error(`Unexpected domain-relative href: ${href}`)
  }

  const attrs = [
    href                      && `href="${href}"`,
    title                     && `title="${title}"`,
    /^[a-z]+:\/\//.test(href) && `target="_blank"`,
  ].filter(Boolean)

  return `<a ${attrs.join(' ')}>${text || ''}</a>`
}

module.exports = function mdLoader (text) {
  this.cacheable()
  return marked(text).replace(/<pre><code class="(.*)">|<pre><code>/g, '<pre><code class="hljs $1">')
}
