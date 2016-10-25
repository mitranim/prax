'use strict'

const hljs = require('highlight.js')
const marked = require('marked')
const pt = require('path')
const prod = process.env.NODE_ENV === 'production'

marked.setOptions({
  highlight: (code, lang) => (
    lang ? hljs.highlight(lang, code) : hljs.highlightAuto(code)
  ).value
})

module.exports = {
  imports: {
    prod,
    url: path => pt.join(pt.dirname(path), pt.parse(path).name)
  },
  ignorePaths: path => /^partials/.test(path),
  rename: '$&/index.html',
  renameExcept: ['index.html', '404.html'],
  pipeline: [
    (content, path) => (
      pt.extname(path) === '.md'
      ? marked(content)
        .replace(/<pre><code class="(.*)">|<pre><code>/g, '<pre><code class="hljs $1">')
        .replace(/<!--\s*:((?:[^:]|:(?!\s*-->))*):\s*-->/g, '$1')
      : content
    )
  ]
}
