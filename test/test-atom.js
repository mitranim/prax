'use strict'

/** ***************************** Dependencies *******************************/

const immute = require('emerge').immute
const replaceAtPath = require('emerge').replaceAtPath
const deepEqual = require('emerge').deepEqual

const pt = require('path')
const main = pt.join(__dirname, '..', require('../package')['jsnext:main'])

const createAtom = require(main).createAtom

/** ********************************* Test ***********************************/

/**
 * TODO test for automatic unsubscription on repeat watch (see tests in <= 0.0.3).
 */

/**
 * Globals
 */

let atom, watch, stop, read, set, patch, last, watcher, watcherShouldThrow

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
 * createAtom
 */

atom = createAtom(prev)

read = atom.read
set = atom.set
patch = atom.patch
watch = atom.watch
stop = atom.stop

if (typeof read !== 'function') throw Error()
if (typeof set !== 'function') throw Error()
if (typeof patch !== 'function') throw Error()
if (typeof watch !== 'function') throw Error()
if (typeof stop !== 'function') throw Error()

// Verify initial state.
if (read() !== prev) throw Error()

// Used across the rest of the test to reset the state.
const RESET = () => {
  stop(watcher)
  watcher = last = watcherShouldThrow = undefined
  set([], prev)
}

/**
 * read
 */

RESET()

if (read() !== prev) throw Error()
if (read('one') !== prev.one) throw Error()
if (read('one', 'two') !== prev.one.two) throw Error()

/**
 * set
 */

RESET()

set([], next)
if (!deepEqual(read(), next)) throw Error()

set(['one'], prev.one)
if (!deepEqual(read('one'), prev.one)) throw Error()

/**
 * patch
 */

RESET()

patch([], next)
if (deepEqual(read(), prev)) throw Error()
if (deepEqual(read(), next)) throw Error()
if (read('one', 'three') !== next.one.three) throw Error()

patch(['one'], {value: NaN})
if (deepEqual(read('one'), {value: NaN})) throw Error()
if (!deepEqual(read('one', 'value'), NaN)) throw Error()

/**
 * Change detection with watch/write.
 *
 * We expect the atom to remember the exact paths accessed by watchers, and
 * rerun them only if the data at those exact paths has changed.
 */

RESET()

// Basic change detection.

watcher = watch(read => {
  last = read('one', 'three')
  if (watcherShouldThrow) throw Error()
})

if (last !== prev.one.three) throw Error()

set([], next)

if (last !== next.one.three) throw Error()

// Reader should not be rerun when data remains unchanged.

set([], {one: {three: NaN}})

watcherShouldThrow = true

set(['one'], {three: NaN})
set(['one', 'three'], NaN)

// Reader that doesn't read any data should be called exactly once.

RESET()

watcher = watch(read => {
  last = true
  if (watcherShouldThrow) throw Error()
})

if (!last) throw Error()

watcherShouldThrow = true
set([], next)
set([], prev)

// Reader that depends on deep leaves should be called only when these leaves
// are changed, and not when the rest of the branch is changed.

RESET()

watcher = watch(read => {
  last = read('one', 'two', 0)
  read('seven', 'eight')
  if (watcherShouldThrow) throw Error()
})

if (last !== prev.one.two[0]) throw Error()

watcherShouldThrow = true
set([], next)

// Reader that reads from root should be rerun on any change.

RESET()

watcher = watch(read => {
  last = read()
})

if (!deepEqual(last, prev)) throw Error()
set([], next)
if (!deepEqual(last, next)) throw Error()

/**
 * stop
 */

RESET()

watcher = watch(read => {
  read()
  read('one', 'three')
  read('seven', 'eight')
  if (watcherShouldThrow) throw Error()
})

watcherShouldThrow = true
stop(watcher)
set([], next)

/**
 * Notification strategy
 */

RESET()

atom = createAtom(prev, notify => {
  return () => {
    last = atom.read()
  }
})

atom.watch(read => {
  read()
  if (watcherShouldThrow) throw Error()
})

// This will cause the watcher to throw if the original notify func is called.
watcherShouldThrow = true

atom.set([], next)

// The custom notify func should have been called.
if (!deepEqual(atom.read(), next)) throw Error()
