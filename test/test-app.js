'use strict'

/* eslint-disable no-inner-declarations */

/**
 * TODO
 *   descriptive tests
 *   emit
 */

/** ***************************** Dependencies *******************************/

const {pipe, add} = require('fpx')
const {eq, deq} = require('./utils')

const {pass} = require('../lib/words')
const {App} = require('../lib/app')

/** ********************************* Test ***********************************/

state: {
  const app = App(null, null, null, 'secret')
  eq(app.getPrev(), undefined)
  eq(app.getMean(), 'secret')
}

reduce: {
  const app = App([add, [[add]]], null, null, 0)

  app.enque(1)
  eq(app.getPrev(), 0)
  eq(app.getMean(), 2)

  app.enque(2)
  eq(app.getPrev(), 2)
  eq(app.getMean(), 6)
}

compute: {
  const compute = pipe(pass, negative)
  const app = App([pass], [compute, [compute]], null, 1)

  app.enque(2)
  eq(app.getMean(), negative(2))

  app.enque(3)
  eq(app.getMean(), negative(3))
}

compute_stabilising: {
  function compute (prev, next) {
    return next < 10 ? next + 1 : next
  }

  const app = App([pass], [compute], null, 1)

  app.enque(null)
  eq(app.getMean(), 10)
}

effects: {
  const app = App()
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
    [pass],
    null,
    [(prev, next) => {
      eq(prev, app.getPrev())
      eq(next, app.getMean())
    }]
  )

  app.enque(1)
  eq(app.getMean(), 1)

  app.enque(2)
  eq(app.getMean(), 2)
}

enqueEffectReturns: {
  const pending = ['second msg']
  const processed = []

  const app = App(
    [function reducer (_, event) {
      processed.push(event)
    }],
    null,
    [function effect () {
      return pending.shift()
    }]
  )

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
