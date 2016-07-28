const {Que, App, migrateApp, getIn, pipe, flat, st, stk} = require('prax')
const {merge, domEvent} = require('./utils')

/**
 * Features
 */

const feats = [
  require('./feature')
]

const extract = key => flat(feats.map(feat => feat[key]).filter(Boolean))

/**
 * App
 */

const app = migrateApp(
  getIn(window, ['dev', 'app']) || App(Que()),
  extract('reducers'),
  extract('computers'),
  extract('effects')
)

app.que.consumer = app.main

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

domEvent(module, document, 'keypress', pipe(keyCode, app.enque))

app.enque(st('init', merge(...extract('state'), app.mean)))

/**
 * Misc
 */

window.dev = {...window.dev, app, st, stk,
  read () {
    return getIn(app.mean, arguments)
  },
  set (...path) {
    app.enque({type: 'set', path, value: path.pop()})
  }
}

if (window.devMode) Object.assign(window, window.dev)
