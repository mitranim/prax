'use strict'

/** ***************************** Dependencies *******************************/

const immutableClone = require('emerge').immutableClone
const replaceAtPath = require('emerge').replaceAtPath
const deepEqual = require('emerge').deepEqual

const Atom = require(process.cwd() + '/lib/atom').Atom

/** ********************************* Test ***********************************/

/**
 * Globals
 */

let atom, read, set, patch, subscribe, watch, last, watcherShouldThrow, unsub

const prev = immutableClone({
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
 * Atom
 */

atom = Atom(prev)

read = atom.read
set = atom.set
patch = atom.patch
subscribe = atom.subscribe
watch = atom.watch

if (typeof read !== 'function') throw Error()
if (typeof set !== 'function') throw Error()
if (typeof patch !== 'function') throw Error()
if (typeof subscribe !== 'function') throw Error()
if (typeof watch !== 'function') throw Error()

// Verify initial state.
if (!deepEqual(read(), prev)) throw Error()

// Used across the rest of the test to reset the state.
const RESET = () => {
  if (unsub) unsub()
  last = watcherShouldThrow = unsub = undefined
  set([], prev)
}

/**
 * read
 */

RESET()

if (!deepEqual(read(), prev)) throw Error()
if (!deepEqual(read('one'), prev.one)) throw Error()
if (!deepEqual(read('one', 'two'), prev.one.two)) throw Error()

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
 * subscribe
 */

RESET()

unsub = subscribe((prev, next) => {
  last = next
})

if (!deepEqual(last, prev)) throw Error()

unsub()

set([], next)

unsub = subscribe((_prev, _next) => {
  last = 'subscriber called'
  if (!deepEqual(prev, _prev)) throw Error()
  if (!deepEqual(next, _next)) throw Error()
})

if (last !== 'subscriber called') throw Error()

/**
 * Change detection with watch.
 *
 * Watchers should be rerun when and only when data they access through the
 * "read" function is changed.
 */

RESET()

// Basic change detection.

unsub = watch(read => {
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

unsub = watch(read => {
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

unsub = watch(read => {
  last = read('one', 'two', 0)
  read('seven', 'eight')
  if (watcherShouldThrow) throw Error()
})

if (last !== prev.one.two[0]) throw Error()

watcherShouldThrow = true
set([], next)

// Reader that reads from root should be rerun on any change.

RESET()

unsub = watch(read => {
  last = read()
})

if (!deepEqual(last, prev)) throw Error()
set([], next)
if (!deepEqual(last, next)) throw Error()

/**
 * unsub
 */

RESET()

unsub = subscribe(() => {
  if (watcherShouldThrow) throw Error()
})

watcherShouldThrow = true
unsub()
set([], next)

RESET()

unsub = watch(read => {
  read()
  read('one', 'three')
  read('seven', 'eight')
  if (watcherShouldThrow) throw Error()
})

watcherShouldThrow = true
unsub()
set([], next)

/**
 * Linearity
 *
 * If epoch transitions are not linear, this contraption blows up the stack.
 */

RESET()

const unsubs = []
unsub = () => { while (unsubs.length) unsubs.shift()() }
let first = true
set([], 1)

unsubs.push(subscribe((prev, next) => {
  const val = next
  if (!first) set([], val + 1)
}))

unsubs.push(subscribe((prev, next) => {
  first = false
  if (next === 3) unsub()
}))

set([], read() + 1)
