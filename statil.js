'use strict'

const hljs = require('highlight.js')
const marked = require('marked')
const pt = require('path')
const flags = require('yargs').boolean('prod').argv

/*
 * Markdown config
 */

marked.setOptions({
  smartypants: true,
  highlight (code, lang) {
    const result = lang ? hljs.highlight(lang, code) : hljs.highlightAuto(code)
    return result.value
  }
})

/*
 * Statil config
 */

module.exports = {
  imports: {
    prod: flags.prod
  },
  ignorePaths: path => (
    /^partials/.test(path)
  ),
  rename: '$&/index.html',
  renameExcept: ['index.html', '404.html'],
  pipeline: [
    (content, path) => {
      if (pt.extname(path) === '.md') {
        return marked(content)
          .replace(/<pre><code class="(.*)">|<pre><code>/g, '<pre><code class="hljs $1">')
          .replace(/<!--\s*:((?:[^:]|:(?!\s*-->))*):\s*-->/g, '$1')
      }
    }
  ]
}
