import {App, Emit} from 'prax/app'
import {Watch, WatchNow} from 'prax/watch'
import {st, std} from 'prax/reduce'

import reducers from './reducers'
import computers from './computers'
import effects from './effects'

const init = {
  keyCode: 0,
  profiles: {},
  visibility: {},
  updating: {}
}

/**
 * Globals
 */

const app = App(reducers, computers, effects, init)

export const emit = Emit(app.enque)

export const watch = Watch(app.addEffect)

export const watchNow = WatchNow(app)

/**
 * Render Utils
 */

import {Component} from 'react'
import {Auto, ReactiveRender} from 'prax/react'

export const auto = Auto(Component, watchNow)
export const reactiveRender = ReactiveRender(watchNow)

/**
 * Init
 */

require('./effects')

function keyCode (event) {
  return st('keyCode', event.keyCode)
}

document.addEventListener('keypress', emit(keyCode))

/**
 * Misc
 */

if (window.developmentMode) {
  window.app = app
  window.emit = emit
  window.watch = watch
  window.st = st
  window.std = std
}
