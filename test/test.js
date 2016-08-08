'use strict'

/**
 * TODO use fpx test utils
 */

const fs = require('fs')

// Hack to enable test-only code.
require.extensions['.js'] = (module, path) => {
  module._compile(
    fs.readFileSync(path, 'utf8')
      .replace(/^\s*\/\*\s*#if\s+TESTING\b.*$/gm, '')
      .replace(/^\s*#endif.*\*\/$/gm, ''),
    path
  )
}

require('./test-app')
require('./test-compute')
require('./test-effects')
require('./test-pattern')
require('./test-que')
require('./test-reduce')
require('./test-watch')

console.log(`${time()} Finished test without errors.`)

function time () {
  const now = new Date()
  return `[${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}]`
}

function pad (val) {
  return typeof val !== 'string'
    ? pad(String(val))
    : val.length < 2 ? ('0' + val) : val
}
