const {Que, App, getIn, bind, comp, flat, st, stk} = require('prax')
const {merge, domEvent} = require('./utils')

/**
 * Features
 */

const feats = [
  require('./feature')
]

const extract = key => flat(feats.map(feat => feat[key]).filter(Boolean))

/**
 * Que
 */

const que = getIn(window, ['dev', 'que']) || Que()

export const {enque} = que

export const emit = bind(comp, enque)

/**
 * App
 */

const app = App(
  que,
  merge(...extract('state'), getIn(window, ['dev', 'app', 'mean'])),
  extract('reducers'),
  extract('computers'),
  extract('effects')
)

que.consumer = app.main

/**
 * Render Utils
 */

const {Component} = require('react')
const {Auto, ReactiveRender, WatchNow} = require('prax/react')

export const auto = Auto(Component, WatchNow(app))
export const reactiveRender = ReactiveRender(WatchNow(app))

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

window.dev = {...window.dev, que, enque, app, st, stk,
  read () {
    return getIn(app.mean, arguments)
  },
  set (...path) {
    enque({type: 'set', path, value: path.pop()})
  }
}

if (window.devMode) Object.assign(window, window.dev)
