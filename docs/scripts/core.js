import {readAt} from 'prax/emerge'
import {App, EmitMono} from 'prax/app'
import {WatchNow} from 'prax/watch'
import {st, stk, stf, stkf} from 'prax/reduce'
import {mergeAll, domEvent} from './utils'

/**
 * Globals
 */

import * as feature from './feature'

const app = App(
  feature.reducers,
  feature.computers,
  feature.effects,
  mergeAll(feature.state, window.__app_state__)
)

export const emit = EmitMono(app.enque)

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

domEvent(module, document, 'keypress', emit(keyCode))

/**
 * Misc
 */

if (module.hot) {
  module.hot.dispose(() => {
    window.__app_state__ = app.getMean()
  })
}

window.dev = {...window.dev, app, emit, st, stk, stf, stkf,
  read () {
    return readAt(arguments, app.getMean())
  }
}

if (window.developmentMode) Object.assign(window, window.dev)
