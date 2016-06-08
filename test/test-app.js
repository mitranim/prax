'use strict'

/* eslint-disable no-inner-declarations */

/**
 * TODO
 *   descriptive tests
 *   emit
 */

/** ***************************** Dependencies *******************************/

const {pipe} = require('fpx')
const {eq, deq, throws} = require('./utils')

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

compute__stabilising: {
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

// prev === getPrev()
// mean === getMean()
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

effectValues: {
  const stack = [1, 2]
  const out = []
  const app = App(
    [(_, event) => {out.push(event)}],
    null,
    [() => stack.shift()]
  )

  app.enque(null)

  deq(stack, [])
  deq(out, [null, 1, 2])
}

dataPhasePurity: {
  const app = App([enqueOne], [enqueOne])

  function enqueOne () {
    app.enque(1)
  }

  throws(function enque () {app.enque(null)})
}

/**
 * Utils
 */

function add (a, b) {
  return a + b
}

function negative (value) {
  return value < 0 ? value : -value
}
