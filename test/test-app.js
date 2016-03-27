'use strict'

/* eslint-disable block-spacing, no-empty-label, no-label-var, no-labels,
   no-inner-declarations */

/**
 * TODO
 *   descriptive tests
 *   emit
 */

/** ***************************** Dependencies *******************************/

const utils = require('./utils')
const eq = utils.eq
const deq = utils.deq
const throws = utils.throws

const pass = require(process.cwd() + '/lib/reduce').pass
const pipe = require(process.cwd() + '/lib/lang').pipe

const App = require(process.cwd() + '/lib/app').App

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
