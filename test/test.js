'use strict'

/** ***************************** Dependencies *******************************/

const pt = require('path')
const main = pt.join(__dirname, '..', require('../package')['jsnext:main'])

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
let last, source, reader, active, runs, readers

/**
 * Source
 */

last = source = reader = active = runs = readers = undefined

source = new Source(first)

if (source.read() !== first) {
  throw Error(`expected ${first}, got ${source.read()}`)
}

source.write(second)

if (source.read() !== second) {
  throw Error(`expected ${second}, got ${source.read()}`)
}

/**
 * Autorun
 */

last = source = reader = active = runs = readers = undefined

source = new Source(first)
active = true
runs = 0

autorun(function () {
  if (active) last = source.read()
  else throwAfterFirst()
})

if (last !== first) throw Error()

source.write(second)

if (last !== second) throw Error()

source.write(first)

if (last !== first) throw Error()

source.write(second)

if (last !== second) throw Error()

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
    else throw Error()
  })
})

if (source.beacon.readers.length !== 10) {
  throw Error(`Expected 10 readers, found: ${source.beacon.readers.length}`)
}

// This write should successfully flush all the readers.
source.write(first)

if (source.beacon.readers.length !== 0) {
  throw Error(`Expected readers to be flushed, found: ${source.beacon.readers.length}`)
}

/**
 * Using Beacon to create a custom reactive data source
 */

last = source = reader = active = runs = readers = undefined

active = true
runs = 0

autorun(function () {
  if (active) last = db.getLast()
  else throwAfterFirst()
})

db.add(first)

if (last !== first) throw Error()

db.add(second)

if (last !== second) throw Error()

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

last = source = reader = active = runs = readers = undefined

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

last = source = reader = active = runs = readers = undefined

source = new Source(first)
runs = 0

reader = autorun(function () {
  throwAfterFirst()
  source.read()
})

// From now, the reader should never be called again.
stop(reader)

// Should not throw.
source.write(second)
source.write(first)

/**
 * Cleanup of multiple readers from one source
 */

last = source = reader = active = runs = readers = undefined

source = new Source(first)

// Via `write`.

times(10, () => {
  let runs = 0
  autorun(function () {
    if (!runs++) source.read()
  })
  if (!runs) throw Error('failed to run')

  source.write(first)
  if (source.beacon.readers.length !== 0) {
    throw Error('failed to clean up readers')
  }
})

// Via `stop`.

readers = []

times(10, () => {
  let runs = 0
  readers.push(autorun(function () {
    if (!runs++) source.read()
  }))
  if (!runs) throw Error('failed to run')
})

if (source.beacon.readers.length !== 10) {
  throw Error('expected 10 readers')
}

readers.forEach(stop)

if (source.beacon.readers.length !== 0) {
  throw Error('failed to clean up all readers')
}

// Via `autorun`.

readers = []

times(10, () => {
  let runs = 0
  readers.push(autorun(function () {
    if (!runs++) source.read()
  }))
  if (!runs) throw Error('failed to run')
})

readers.forEach(autorun)

if (source.beacon.readers.length !== 0) {
  throw Error('failed to clean up all readers')
}

/**
 * Indirect effects
 */

last = source = reader = active = runs = readers = undefined

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

if (last !== first) throw Error()

indirectWrite(second)

if (last !== second) throw Error()

/**
 * Automatic switch between sources
 */

last = source = reader = active = runs = readers = undefined

const sourceOne = new Source(first)
const sourceTwo = new Source(second)
source = sourceOne
last = null

reader = autorun(function () {
  last = source.read()
})

if (last !== first) throw Error()

// Switch on write, with cleanup

source = sourceTwo

sourceTwo.write(second)
if (last !== first) throw Error()

sourceOne.write(first)
if (last !== second) throw Error()

if (sourceOne.beacon.readers.length !== 0) throw Error()
if (sourceTwo.beacon.readers.length !== 1) throw Error()

// Switch on autorun, with cleanup

source = sourceOne
autorun(reader)

if (last !== first) throw Error()

source = sourceTwo
autorun(reader)

if (last !== second) throw Error()

if (sourceOne.beacon.readers.length !== 0) throw Error()
if (sourceTwo.beacon.readers.length !== 1) throw Error()

/**
 * Interoperation between multiple copies of prax.
 */

last = source = reader = active = runs = readers = undefined

source = new Source(first)

if (!require.cache[main]) throw Error()
delete require.cache[main]

const secondAutorun = require(main).autorun

secondAutorun(function () {
  last = source.read()
})

if (last !== first) throw Error()

/** ******************************** Utils ***********************************/

function throwAfterFirst () {
  runs += 1

  if (runs > 1) {
    throw Error('unexpectedly called more than once after unsubscribing')
  } else if (runs !== 1) {
    throw Error('internal test error: expected runs to equal 1, got: ' + runs)
  }
}

function times (num, func) {
  Array(num).fill().forEach(func)
}

console.info(`[${new Date().getHours()}:${new Date().getMinutes()}:${new Date().getSeconds()}] Finished test without errors.`)
