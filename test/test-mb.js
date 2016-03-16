'use strict'

/** ***************************** Dependencies *******************************/

const Mb = require(process.cwd() + '/lib/mb').Mb

/** ********************************* Test ***********************************/

/**
 * Globals
 */

let mb, send, match, last, unsub

const RESET = () => {
  mb = Mb()
  send = mb.send
  match = mb.match
  last = unsub = undefined
}

/**
 * match / send
 */

RESET()

unsub = match(Number.isInteger, msg => {
  last = msg
})

send(1.1)
if (last !== undefined) throw Error()

send(1)
if (last !== 1) throw Error()

send(2)
if (last !== 2) throw Error()

/**
 * unsub
 */

if (typeof unsub !== 'function') throw Error()

unsub()

send(3)
if (last !== 2) throw Error()

/**
 * match many / send / order of factors
 */

RESET()

match(Number.isInteger, msg => {
  last = msg
})

match(Number.isInteger, msg => {
  last = last * msg
})

send(2)

if (last !== 4) throw Error()

/**
 * Mb(...pairs)
 */

mb = Mb(
  Boolean, msg => {
    last = msg
  },
  Boolean, msg => {
    last += msg
  }
)

mb.send('test')

if (last !== 'testtest') throw Error()

/**
 * Nested
 */

RESET()

match(Boolean, msg => {
  last = msg
})

match(Boolean, Mb(
  Number.isInteger, msg => {
    last += msg
  },
  Number.isFinite, msg => {
    last *= msg
  }
).send)

send(12)

if (last !== (12 + 12) * 12) throw Error()
