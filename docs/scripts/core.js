const {App, EmitMono: Emit, WatchNow, st, stk, stf, stkf, getIn} = require('prax')
const {merge, domEvent} = require('./utils')

/**
 * Globals
 */

const feature = require('./feature')

const app = App(
  feature.reducers,
  feature.computers,
  feature.effects,
  merge(feature.state, window.__app_state__)
)

export const emit = Emit(app.enque)

export const watchNow = WatchNow(app)

/**
 * Render Utils
 */

const {Component} = require('react')
const {Auto, ReactiveRender} = require('prax/react')

export const auto = Auto(Component, watchNow)
export const reactiveRender = ReactiveRender(watchNow)

/**
 * Init
 */

function keyCode (event) {
  return st('keyCode', event.keyCode)
}

domEvent(module, document, 'keypress', emit(keyCode))

/**
 * Misc
 */

if (module.hot) {
  module.hot.dispose(() => {
    window.__app_state__ = app.getMean()
    app.die()
  })
}

window.dev = {...window.dev, app, emit, st, stk, stf, stkf,
  read () {
    return getIn(app.getMean(), arguments)
  }
}

if (window.devMode) Object.assign(window, window.dev)
