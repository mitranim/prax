'use strict'

/* eslint-disable no-inner-declarations */

/**
 * TODO
 *   descriptive tests
 */

/** ***************************** Dependencies *******************************/

const {pipe, add} = require('fpx')
const {eq, deq} = require('./utils')

const {pass} = require('../lib/words')
const {Que} = require('../lib/que')
const {App} = require('../lib/app')

/** ********************************* Test ***********************************/

state: {
  const app = App(Que(), 'secret')
  eq(app.prev, undefined)
  eq(app.mean, 'secret')
}

reduce: {
  const que = Que()
  const app = App(que, 0, [add, [[add]]])
  que.consumer = app.main

  que.enque(1)
  eq(app.prev, 0)
  eq(app.mean, 2)

  que.enque(2)
  eq(app.prev, 2)
  eq(app.mean, 6)
}

compute: {
  const que = Que()
  const compute = pipe(pass, negative)
  const app = App(que, 1, [pass], [compute, [compute]])
  que.consumer = app.main

  que.enque(2)
  eq(app.mean, negative(2))

  que.enque(3)
  eq(app.mean, negative(3))
}

compute_stabilising: {
  function compute (prev, next) {
    return next < 10 ? next + 1 : next
  }

  const que = Que()
  const app = App(que, 1, [pass], [compute])
  que.consumer = app.main

  que.enque(null)
  eq(app.mean, 10)
}

effects: {
  const que = Que()
  const app = App(que)
  que.consumer = app.main

  const out = []
  const unsub = app.addEffect(() => {out.push(1)})

  que.enque(1)
  deq(out, [1])

  unsub()
  que.enque(2)
  deq(out, [1])
}

stateInEffects: {
  const que = Que()
  const app = App(
    que,
    undefined,
    [pass],
    null,
    [(prev, next) => {
      eq(prev, app.prev)
      eq(next, app.mean)
    }]
  )
  que.consumer = app.main

  que.enque(1)
  eq(app.mean, 1)

  que.enque(2)
  eq(app.mean, 2)
}

enqueEffectReturns: {
  const pending = ['second msg']
  const processed = []

  const que = Que()
  const app = App(
    que,
    null,
    [function reducer (_, event) {
      processed.push(event)
    }],
    null,
    [function effect () {
      return pending.shift()
    }]
  )
  que.consumer = app.main

  que.enque('first msg')

  deq(pending, [])

  // msg returned by effect must have been enqued
  deq(processed, ['first msg', 'second msg'])
}

/**
 * Utils
 */

function negative (value) {
  return value < 0 ? value : -value
}
