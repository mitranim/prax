'use strict'

/* eslint-disable no-inner-declarations */

/**
 * TODO
 *   descriptive tests
 *   move que tests here
 */

/** ***************************** Dependencies *******************************/

const {pipe, add} = require('fpx')
const {eq, deq} = require('./utils')

const {pass} = require('../lib/words')
const {AppCore: App, send, addSub} = require('../lib/app-core')

/** ********************************* Test ***********************************/

state: {
  const app = App('secret', null, null, null)
  eq(app.prev, undefined)
  eq(app.mean, 'secret')
}

send_reduce: {
  const app = App(0, [add, add], null, null)

  send(app, 1)
  eq(app.prev, 0)
  eq(app.mean, add(add(0, 1), 1))

  send(app, 2)
  eq(app.prev, 2)
  eq(app.mean, add(add(2, 2), 2))
}

send_compute: {
  const negate = pipe(pass, negative)
  const app = App(1, [pass], [negate, negate], null)

  send(app, 2)
  eq(app.mean, negate(1, negate(1, 2)))

  send(app, 3)
  eq(app.mean, negate(2, negate(2, 3)))
}

compute_stabilising: {
  function incToTen (prev, next) {
    return next < 10 ? next + 1 : next
  }

  const app = App(1, [pass], [incToTen], null)

  send(app, null)
  eq(app.mean, 10)
}

subs: {
  const app = App()
  const out = []
  const unsub = addSub(app, () => {out.push(1)})

  send(app, 1)
  deq(out, [1])

  unsub()
  send(app, 2)
  deq(out, [1])
}

stateInEffects: {
  const app = App(
    undefined,
    [pass],
    null,
    [(prev, next) => {
      eq(prev, app.prev)
      eq(next, app.mean)
    }]
  )

  send(app, 1)
  eq(app.mean, 1)

  send(app, 2)
  eq(app.mean, 2)
}

ignoreSubReturns: {
  const pending = ['second msg']
  const processed = []

  const app = App(
    undefined,
    [function mod (_, event) {
      processed.push(event)
    }],
    null,
    [function sub () {
      return pending.shift()
    }]
  )

  send(app, 'first msg')

  deq(pending, [])
  // msg returned by sub must have been ignored
  deq(processed, ['first msg'])
}

/**
 * Utils
 */

function negative (value) {
  return value < 0 ? value : -value
}
