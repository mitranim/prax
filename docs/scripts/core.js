import {App, Emit} from 'prax/app'
import {Watch, WatchNow} from 'prax/watch'
import {When} from 'prax/effects'
import {std} from 'prax/reduce'

import reducers from './reducers'
import computers from './computers'

const init = {
  keyCode: 0,
  profiles: {},
  visibility: {},
  updating: {}
}

/**
 * Globals
 */

const app = App(reducers, computers, [], init)

export const emit = Emit(app.enque)

export const watch = Watch(app.addEffect)

export const watchNow = WatchNow(app)

export const when = When(watch)

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

app.init()

function keyCode (event) {
  return std('keyCode', null, event.keyCode)
}

document.addEventListener('keypress', emit(keyCode))

/**
 * Misc
 */

if (window.developmentMode) {
  window.app = app
  window.emit = emit
  window.watch = watch
  window.std = std

  window.test = () => {
    app.enque(std('dialogs', null, [
      {
        subject: 'test',
        last_message: 100,
        last_message_read: 90,
        _shopId: 2
      }
    ]))
    app.enque(std('messages', null, [
      {subject: 'test', sender: 1, receiver: 2, created: 80},
      {subject: 'test', sender: 2, receiver: 1, created: 90},
      {subject: 'test', sender: 1, receiver: 2, created: 100}
    ]))
  }
}
