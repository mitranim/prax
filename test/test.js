'use strict'

/**
 * Hack to enable test-only code.
 */

const fs = require('fs')

require.extensions['.js'] = (module, path) => {
  let content = fs.readFileSync(path, 'utf8')
  content = content
    .replace(/^\s*\/\*\s*#if\s+TESTING\b.*$/gm, '')
    .replace(/^\s*#endif\s+TESTING\b.*\*\/$/gm, '')
  module._compile(content, path)
}

/**
 * Tests
 */

require('./test-atom')
require('./test-fq')

console.info(`[${new Date().getHours()}:${new Date().getMinutes()}:${new Date().getSeconds()}] Finished test without errors.`)
