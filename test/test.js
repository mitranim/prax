'use strict'

/** ****************************** Transpile *********************************/

require('babel-core/register')({
  modules: 'common',
  optional: [
    'spec.protoToAssign',
    'es7.classProperties'
  ],
  loose: [
    'es6.classes',
    'es6.properties.computed'
  ]
})

/** ***************************** Dependencies *******************************/

const main = require('path').join(__dirname, '..', require('../package').main)

const autorun = require(main).autorun
const stop = require(main).stop
const Source = require(main).Source
const Beacon = require(main).Beacon

const db = require('./db').db

/** ********************************* Test ***********************************/

/**
 * Globals
 */

const first = 127
const second = 255
let last = NaN

/**
 * Source
 */

let source = new Source(first)

if (source.read() !== first) {
  throw new Error(`expected ${first}, got ${source.read()}`)
}

source.write(second)

if (source.read() !== second) {
  throw new Error(`expected ${second}, got ${source.read()}`)
}

/**
 * Autorun
 */

source = new Source(first)

let active = true
let runs = 0

autorun(function () {
  if (active) last = source.read()
  else throwAfterFirst()
})

if (last !== first) throw new Error('fail')

source.write(second)

if (last !== second) throw new Error('fail')

source.write(first)

if (last !== first) throw new Error('fail')

source.write(second)

if (last !== second) throw new Error('fail')

/**
 * Automatic cleanup
 */

active = false

// Should not throw.
source.write(first)
source.write(second)

times(10, () => {
  let run = 0
  autorun(function () {
    run++
    if (run === 1) source.read()
    else if (run === 2) return
    else throw new Error('fail')
  })
})

if (source.beacon.readers.length !== 10) {
  throw new Error(`Expected 10 readers, found: ${source.beacon.readers.length}`)
}

// This write should successfully flush all the readers.
source.write(first)

if (source.beacon.readers.length !== 0) {
  throw new Error(`Expected readers to be flushed, found: ${source.beacon.readers.length}`)
}

/**
 * Using Beacon to create a custom reactive data source
 */

active = true
runs = 0

autorun(function () {
  if (active) last = db.getLast()
  else throwAfterFirst()
})

db.add(first)

if (last !== first) throw new Error('fail')

db.add(second)

if (last !== second) throw new Error('fail')

// Automatic cleanup

active = false

// Should not throw.
db.add(first)
db.add(second)

/**
 * Limited cascading.
 *
 * This test checks what happens if more than one beacon is registered with a
 * reader. This could happen if a reader accesses two different data sources,
 * or if one of those sources calls into another.
 *
 * Say the reader stops depending on all of those sources. It was called and
 * did not re-establish the dependencies. When the previous dependencies
 * change, the reader must not be called again. In other words, a rerun caused
 * by one beacon clears the links between the reader and all other beacons.
 */

const beaconOne = new Beacon()
const beaconTwo = new Beacon()

source = {
  value: first,

  read () {
    beaconOne.watch()
    beaconTwo.watch()
    return source.value
  },

  write (value) {
    source.value = value
    beaconOne.trigger()
    beaconTwo.trigger()
  }
}

active = true

autorun(function () {
  if (active) source.read()
  else throwAfterFirst()
})

// From now, the reader should only be called once. It should be removed from
// all beacons before/during/after the first run.
active = false
runs = 0

source.write(second)
source.write(first)

/**
 * Cleanup with `stop`
 */

runs = 0

let reader = autorun(function () {
  throwAfterFirst()
  source.read()
})

// From now, the reader should never be called again.
stop(reader)

// Should not throw.
source.write(first)
source.write(second)

/**
 * Cleanup of multiple readers from one source
 */

source = new Source(first)

// Via `write`.

times(10, () => {
  let runs = 0
  autorun(function () {
    if (!runs++) source.read()
  })
  if (!runs) throw new Error('failed to run')

  source.write(first)
  if (source.beacon.readers.length !== 0) {
    throw new Error('failed to clean up readers')
  }
})

// Via `stop`.

let readers = []

times(10, () => {
  let runs = 0
  readers.push(autorun(function () {
    if (!runs++) source.read()
  }))
  if (!runs) throw new Error('failed to run')
})

if (source.beacon.readers.length !== 10) {
  throw new Error('expected 10 readers')
}

readers.forEach(stop)

if (source.beacon.readers.length !== 0) {
  throw new Error('failed to clean up all readers')
}

// Via `autorun`.

readers = []

times(10, () => {
  let runs = 0
  readers.push(autorun(function () {
    if (!runs++) source.read()
  }))
  if (!runs) throw new Error('failed to run')
})

readers.forEach(autorun)

if (source.beacon.readers.length !== 0) {
  throw new Error('failed to clean up all readers')
}

/**
 * Indirect effects
 */

source = new Source(first)
last = null

function indirectRead () {
  return source.read()
}

function indirectWrite (value) {
  source.write(value)
}

autorun(function () {
  last = indirectRead()
})

if (last !== first) throw new Error('fail')

indirectWrite(second)

if (last !== second) throw new Error('fail')

/**
 * Automatic switch between sources
 */

const sourceOne = new Source(first)
const sourceTwo = new Source(second)
source = sourceOne
last = null

reader = autorun(function () {
  last = source.read()
})

if (last !== first) throw new Error('fail')

// Switch on write, with cleanup

source = sourceTwo

sourceTwo.write(second)
if (last !== first) throw new Error('fail')

sourceOne.write(first)
if (last !== second) throw new Error('fail')

if (sourceOne.beacon.readers.length !== 0) throw new Error('fail')
if (sourceTwo.beacon.readers.length !== 1) throw new Error('fail')

// Switch on autorun, with cleanup

source = sourceOne
autorun(reader)

if (last !== first) throw new Error('fail')

source = sourceTwo
autorun(reader)

if (last !== second) throw new Error('fail')

if (sourceOne.beacon.readers.length !== 0) throw new Error('fail')
if (sourceTwo.beacon.readers.length !== 1) throw new Error('fail')

/** ******************************** Utils ***********************************/

function throwAfterFirst () {
  runs += 1

  if (runs > 1) {
    throw new Error('unexpectedly called more than once after unsubscribing')
  } else if (runs !== 1) {
    throw new Error('internal test error: expected runs to equal 1, got: ' + runs)
  }
}

function times (num, func) {
  Array(num).fill().forEach(func)
}
