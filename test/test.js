'use strict'

const fs = require('fs')

// Hack to enable test-only code.
require.extensions['.js'] = (module, path) => {
  let content = fs.readFileSync(path, 'utf8')
  content = content
    .replace(/^\s*\/\*\s*#if\s+TESTING\b.*$/gm, '')
    .replace(/^\s*#endif.*\*\/$/gm, '')
  module._compile(content, path)
}

// require('./test-atom')
require('./test-mb')
require('./test-pattern')
require('./test-que')
require('./test-app')

console.log(`[${pad(new Date().getHours())}:${pad(new Date().getMinutes())}:${pad(new Date().getSeconds())}] Finished test without errors.`)

function pad (val) {
  val = String(val)
  return val.length < 2 ? ('0' + val) : val
}
