// This must be executed before any other code.
if (module.hot) {
  module.hot.accept(err => {
    console.warn('Exception during HMR update.', err)
  })
  module.hot.dispose(() => {
    console.clear()
    if (typeof deinit === 'function') deinit()
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

const {env, init} = require('./core')

// true = use subdirectories
const requireContext = require.context('./features', true, /\.js$/)

const features = requireContext.keys().map(requireContext)

let deinit

env.enque(function setup () {
  deinit = init(env, features)
  env.notifyWatchers(env.state, env.state)
})

/**
 * Dev
 */

const prax = require('prax')

const globals = {...prax}
delete globals.isNaN
delete globals.isFinite

window.dev = {prax, ...globals, ...window.dev}

if (window.devMode) Object.assign(window, window.dev)
