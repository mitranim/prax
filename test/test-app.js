'use strict'

/* eslint-disable block-spacing */

/**
 * TODO
 *   descriptive tests
 *   emit
 */

/** ***************************** Dependencies *******************************/

const deepEqual = require('emerge').deepEqual
const App = require(process.cwd() + '/lib/app').App
const pipe = require(process.cwd() + '/lib/lang').pipe
const pass = require(process.cwd() + '/lib/reduce').pass

/** ********************************* Test ***********************************/

call(function state () {
  const app = App(null, null, null, 'secret')
  if (app.getPrev() !== undefined) throw Error()
  if (app.getMean() !== 'secret') throw Error()
})

call(function reduce () {
  const app = App([add, [[add]]], null, null, 0)

  app.enque(1)
  if (app.getPrev() !== 0) throw Error()
  if (app.getMean() !== 2) throw Error()

  app.enque(2)
  if (app.getPrev() !== 2) throw Error()
  if (app.getMean() !== 6) throw Error()
})

call(function compute () {
  const compute = pipe(pass, negative)
  const app = App([pass], [compute, [compute]], null, 1)

  app.enque(2)
  const next0 = negative(2)
  if (app.getMean() !== next0) throw Error()

  app.enque(3)
  const next1 = negative(3)
  if (app.getMean() !== next1) throw Error()
})

call(function effects () {
  const app = App()
  const out = []
  const unsub = app.addEffect(() => {out.push(1)})

  app.enque(1)
  if (!deepEqual(out, [1])) throw Error()

  unsub()
  app.enque(2)
  if (!deepEqual(out, [1])) throw Error()
})

// prev === getPrev()
// mean === getMean()
call(function stateInEffects () {
  const app = App(
    [pass],
    null,
    [(prev, next) => {
      if (prev !== app.getPrev()) throw Error()
      if (next !== app.getMean()) throw Error()
    }]
  )

  app.enque(1)
  if (app.getMean() !== 1) throw Error()

  app.enque(2)
  if (app.getMean() !== 2) throw Error()
})

call(function effectValues () {
  const stack = [1, 2]
  const out = []
  const app = App(
    [(_, event) => {out.push(event)}],
    null,
    [() => stack.shift()]
  )

  app.enque(null)

  if (!deepEqual(stack, [])) throw Error()
  if (!deepEqual(out, [null, 1, 2])) throw Error()
})

call(function dataPhasePurity () {
  const app = App([enqueOne], [enqueOne])

  function enqueOne () {
    app.enque(1)
  }

  let err
  try {app.enque(1)} catch (e) {err = e}

  if (!err) throw Error()
})

/**
 * Utils
 */

function call (func) {
  func()
}

function add (a, b) {
  return a + b
}

function negative (value) {
  return value < 0 ? value : -value
}
