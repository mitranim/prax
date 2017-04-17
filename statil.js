'use strict'

const hljs = require('highlight.js')
const marked = require('marked')
const pt = require('path')
const {ifonly, not, test, testOr} = require('fpx')
const {version} = require('./package.json')
const prod = process.env.NODE_ENV === 'production'

marked.setOptions({
  highlight: (code, lang) => (
    lang ? hljs.highlight(lang, code) : hljs.highlightAuto(code)
  ).value
})

module.exports = {
  imports: {
    version,
    prod,
    url: path => pt.join(pt.dirname(path), pt.parse(path).name),
    md: content => (
      marked(content)
      .replace(/<pre><code class="(.*)">|<pre><code>/g, '<pre><code class="hljs $1">')
      .replace(/<!--\s*:((?:[^:]|:(?!\s*-->))*):\s*-->/g, '$1')
    ),
  },
  ignorePath: test(/^partials/),
  renamePath: ifonly(
    not(testOr('index.html', '404.html')),
    (path, {dir, name}) => pt.join(dir, name, 'index.html')
  ),
}
