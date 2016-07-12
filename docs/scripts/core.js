const {Que, App, getIn, pipe, flat, st, stk} = require('prax')
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

const {createClass} = require('react')
const {Auto, ReactiveClass} = require('prax/react')

export const auto = Auto(app, createClass)
export const reactiveClass = ReactiveClass(app, createClass)

/**
 * Init
 */

function keyCode (event) {
  return st('keyCode', event.keyCode)
}

domEvent(module, document, 'keypress', pipe(keyCode, enque))

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
