'use strict'

/** ***************************** Dependencies *******************************/

const createMb = require('../lib/mb').createMb
const toTest = require('../lib/mb').toTest

/** ********************************* Test ***********************************/

/**
 * Globals
 */

let mb, send, match, last, unsub

const RESET = () => {
  mb = createMb()
  send = mb.send
  match = mb.match
  last = unsub = undefined
}

/**
 * toTest
 */

// Primitives.

if (toTest('pattern')('PATTERN')) throw Error()
if (!toTest('pattern')('pattern')) throw Error()

if (toTest(NaN)(undefined)) throw Error()
if (!toTest(NaN)(NaN)) throw Error()

// Functions.

if (toTest(isNumber)('not a number')) throw Error()
if (!toTest(isNumber)(Infinity)) throw Error()

// Objects.

if (toTest({type: 'fork'})({type: 'FORK'})) throw Error()
if (toTest({type: 'fork'})(null)) throw Error()
if (!toTest({type: 'fork'})({type: 'fork', extra: true})) throw Error()

// Nested objects.

if (toTest({space: {time: NaN}})({space: {}})) throw Error()
if (toTest({space: {time: NaN}})({space: {time: {}}})) throw Error()
if (toTest({space: {time: NaN}})({space: null})) throw Error()
if (!toTest({space: {time: NaN}})({space: {time: NaN}, extra: true})) throw Error()

// Combined and nested.

if (toTest({space: {time: NaN}, value: isNumber})({space: {}})) throw Error()
if (toTest({space: {time: NaN}, value: isNumber})({space: {time: {}}, value: 'not a number'})) throw Error()
if (!toTest({space: {time: NaN}, value: isNumber})({space: {time: NaN}, value: Infinity})) throw Error()

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
 * createMb(...pairs)
 */

mb = createMb(
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

match(Boolean, createMb(
  Number.isInteger, msg => {
    last += msg
  },
  Number.isFinite, msg => {
    last *= msg
  }
).send)

send(12)

if (last !== (12 + 12) * 12) throw Error()

/**
 * Utils
 */

function isNumber (value) {
  return typeof value === 'number'
}
