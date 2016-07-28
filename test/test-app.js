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

reduce: {
  const app = App(Que(), [add, [[add]]])

  app.que.consumer = app.main
  app.mean = 0

  app.enque(1)
  eq(app.prev, 0)
  eq(app.mean, 2)

  app.enque(2)
  eq(app.prev, 2)
  eq(app.mean, 6)
}

compute: {
  const compute = pipe(pass, negative)
  const app = App(Que(), [pass], [compute, [compute]])

  app.que.consumer = app.main
  app.mean = 1

  app.enque(2)
  eq(app.mean, negative(2))

  app.enque(3)
  eq(app.mean, negative(3))
}

compute_stabilising: {
  function compute (prev, next) {
    return next < 10 ? next + 1 : next
  }

  const app = App(Que(), [pass], [compute])

  app.que.consumer = app.main
  app.mean = 1

  app.enque(null)
  eq(app.mean, 10)
}

effects: {
  const app = App(Que())

  app.que.consumer = app.main
  app.mean = 1

  const out = []
  const unsub = app.addEffect(() => {out.push(1)})

  app.enque(1)
  deq(out, [1])

  unsub()
  app.enque(2)
  deq(out, [1])
}

stateInEffects: {
  const app = App(
    Que(),
    [pass],
    null,
    [(prev, next) => {
      eq(prev, app.prev)
      eq(next, app.mean)
    }]
  )
  app.que.consumer = app.main

  app.enque(1)
  eq(app.mean, 1)

  app.enque(2)
  eq(app.mean, 2)
}

enqueEffectReturns: {
  const pending = ['second msg']
  const processed = []

  const app = App(
    Que(),
    [function reducer (_, event) {
      processed.push(event)
    }],
    null,
    [function effect () {
      return pending.shift()
    }]
  )

  app.que.consumer = app.main

  app.enque('first msg')

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
