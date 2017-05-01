// This must be executed before any other code.
if (module.hot) {
  module.hot.accept(err => {
    console.warn('Exception during HMR update.', err)
  })
  module.hot.dispose(() => {
    console.clear()
  })
}

const {deinit} = require('prax')

if (!window.app) window.app = {}

const {Env} = require('./env')

const prevEnv = window.app.env

export const env = window.app.env = new Env()

try {
  // Env should deinit prevEnv
  env.init(prevEnv)
}
catch (err) {
  // Now it's up to us
  deinit(prevEnv)
  deinit(env)
  throw err
}

/**
 * REPL
 */

const prax = window.prax = require('prax')

window.app = {...window.app, ...prax, prax, env}

delete window.app.isNaN
delete window.app.isFinite
delete window.app.exports

if (!window.ENV.prod) {
  Object.assign(window, window.app)
  ;['log', 'info', 'warn', 'error', 'clear'].forEach(key => {
    if (!/bound/.test(console[key].name)) {
      window[key] = console[key] = console[key].bind(console)
    }
  })
}
