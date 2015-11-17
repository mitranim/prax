'use strict'

/** ***************************** Dependencies *******************************/

require('./test-multi')

const immute = require('emerge').immute
const replaceAtPath = require('emerge').replaceAtPath

const pt = require('path')
const main = pt.join(__dirname, '..', require('../package')['jsnext:main'])

const createPrax = require(main).createPrax

/** ********************************* Test ***********************************/

/**
 * Globals
 */

let prax, autorun, stop, read, write, last, reader, readerShouldThrow

const prev = immute({
  one: {two: [2]},
  four: [4],
  seven: {eight: NaN}
})

const next = replaceAtPath(prev, {
  one: {two: [2], three: 3},
  five: {six: 6},
  seven: {eight: NaN}
}, [])

/**
 * createPrax
 */

prax = createPrax(prev)

autorun = prax.autorun
stop = prax.stop
read = prax.read
write = prax.write

if (typeof autorun !== 'function') throw Error()
if (typeof stop !== 'function') throw Error()
if (typeof read !== 'function') throw Error()
if (typeof write !== 'function') throw Error()

// Verify initial state.
if (read() !== prev) throw Error()

// Used across the rest of the test to reset the state.
const reset = () => {
  stop(reader)
  reader = last = readerShouldThrow = undefined
  write(prev)
}

/**
 * read
 */

reset()

if (read() !== prev) throw Error()
if (read('one') !== prev.one) throw Error()
if (read('one', 'two') !== prev.one.two) throw Error()

/**
 * write
 */

reset()
write(next)
if (read() !== next) throw Error()

/**
 * Change detection with autorun/write.
 *
 * We expect prax to remember the exact paths accessed by readers, and rerun
 * them only if the data at those exact paths has changed.
 */

reset()

// Basic change detection.

reader = autorun(() => {
  last = read('one', 'three')
  if (readerShouldThrow) throw Error()
})

if (last !== prev.one.three) throw Error()

write(next)

if (last !== next.one.three) throw Error()

// Reader should not be rerun when data remains unchanged.

write({one: {three: NaN}})

readerShouldThrow = true

write({one: {three: NaN}})
write({one: {three: NaN}})

// Reader that doesn't read any data should be called exactly once.

reset()

reader = autorun(() => {
  last = true
  if (readerShouldThrow) throw Error()
})

if (!last) throw Error()

readerShouldThrow = true
write(next)
write(prev)

// Reader that depends on deep leaves should be called only when these leaves
// are changed, and not when the rest of the branch is changed.

reset()

reader = autorun(() => {
  last = read('one', 'two', 0)
  read('seven', 'eight')
  if (readerShouldThrow) throw Error()
})

if (last !== prev.one.two[0]) throw Error()

readerShouldThrow = true
write(next)

// Reader that reads from root should be rerun on any change.

reset()

reader = autorun(() => {
  last = read()
})

if (last !== prev) throw Error()
write(next)
if (last !== next) throw Error()

/**
 * stop
 */

reset()

reader = autorun(() => {
  read()
  read('one', 'three')
  read('seven', 'eight')
  if (readerShouldThrow) throw Error()
})

readerShouldThrow = true
stop(reader)
write(next)

console.info(`[${new Date().getHours()}:${new Date().getMinutes()}:${new Date().getSeconds()}] Finished test without errors.`)
