import {readAt} from 'prax/emerge'
import {createWatcher} from 'prax'
import {createEventLoop} from 'prax/event-loop'
import {callEach, foldl, remove, resolve, flat} from 'prax/lang'
import {reduceIterator, computeIterator, std} from 'prax/reduce'

/**
 * Globals
 */

const reducers = flat(require('./reducers').default)

const computers = flat(require('./computers').default)

let effects = []

let prev

let state

/**
 * Effects
 */

function mainLoop (event) {
  prev = state
  let next = foldl(reducers, reduceIterator(event), prev)
  next = foldl(computers, computeIterator(prev), next)
  state = next
  callEach(effects, prev, next)
}

const tick = createEventLoop(mainLoop)

export function emit (value) {
  return function () {
    return tick(resolve(value, arguments))
  }
}

export function subscribe (func) {
  func(prev, state)
  effects = effects.concat(func)
  return () => { effects = remove(effects, func) }
}

export function watch (func) {
  return subscribe(createWatcher(func))
}

/**
 * Render Utils
 */

import {Component} from 'react'
import {createAuto, createReactiveRender} from 'prax/react'

export const auto = createAuto(Component, watch)
export const reactiveRender = createReactiveRender(watch)

/**
 * Init
 */

tick(std('init', null, {
  keyCode: 0,
  profiles: {},
  visibility: {},
  updating: {}
}))

require('./effects')

function keyCode (event) {
  return std('keyCode', null, event.keyCode)
}

document.addEventListener('keypress', emit(keyCode))

/**
 * Misc
 */

if (window.developmentMode) {
  Object.defineProperty(window, 'state', {get: () => state})
  window.readAt = readAt
  window.emit = emit
  window.tick = tick
  window.subscribe = subscribe
  window.watch = watch
  window.std = std

  window.test = () => {
    tick(std('dialogs', null, [
      {
        subject: 'test',
        last_message: 100,
        last_message_read: 90,
        _shopId: 2
      }
    ]))
    tick(std('messages', null, [
      {subject: 'test', sender: 1, receiver: 2, created: 80},
      {subject: 'test', sender: 2, receiver: 1, created: 90},
      {subject: 'test', sender: 1, receiver: 2, created: 100}
    ]))
  }
}
