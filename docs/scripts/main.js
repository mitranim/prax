// This must be executed before any other code.
if (module.hot) {
  module.hot.accept(err => {
    console.warn('Exception during HMR update.', err)
  })
  module.hot.dispose(() => {
    console.clear()
  })
}

/**
 * Preinit
 */

const {Lifecycler, bind} = require('prax')

const app = window.app || (window.app = {})

const lifecycler = app.lifecycler || (app.lifecycler = new Lifecycler())

const {env, reinit} = require('./env')

// true = use subdirectories
const requireContext = require.context('./features', true, /\.js$/)

const features = requireContext.keys().map(requireContext)

/**
 * Init
 */

require('simple-pjax')

lifecycler.reinit(env, bind(reinit, features))

/**
 * REPL
 */

const prax = require('prax')

const praxExport = {...prax}
delete praxExport.isNaN
delete praxExport.isFinite

window.app = {
  React: require('react'),
  ...window.app,
  ...praxExport,
  prax,
  lifecycler,
}

if (window.devMode) {
  Object.assign(window, window.app)
  ;['log', 'info', 'warn', 'error', 'clear'].forEach(key => {
    if (!/bound/.test(console[key].name)) {
      window[key] = console[key] = console[key].bind(console)
    }
  })
}
