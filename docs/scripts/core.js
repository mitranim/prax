import {App, Emit} from 'prax/app'
import {Watch, WatchNow} from 'prax/watch'
import {st, stk} from 'prax/reduce'

/**
 * Globals
 */

import * as feature from './feature'

const app = App(
  feature.reducers,
  feature.computers,
  feature.effects,
  feature.state
)

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
  window.stk = stk
}
