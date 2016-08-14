// This must be executed before any other code.
if (module.hot) {
  module.hot.accept(err => {
    console.warn('Exception during HMR update.', err)
  })
  module.hot.dispose(() => {
    console.clear()
  })
}

if (window.devMode) {
  ['log', 'info', 'warn', 'error', 'clear'].forEach(key => {
    if (!/bound/.test(console[key].name)) {
      window[key] = console[key] = console[key].bind(console)
    }
  })
}

require('simple-pjax')

require('./core')

/**
 * Dev
 */

const prax = require('prax')

window.dev = {...window.dev, prax}

if (window.devMode) Object.assign(window, prax, window.dev)
