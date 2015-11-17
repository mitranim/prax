'use strict'

// Hack to enable interop between duplicate versions of prax.
const global = new Function('return this')()  // eslint-disable-line
const key = '__prax_current_readers__'
const lowkey = typeof Symbol === 'function' ? Symbol() : (Math.random() * Math.pow(10, 16)).toString(16)

/**
 * Tracking
 */

exports.autorun = autorun
function autorun (reader) {
  if (typeof reader !== 'function') {
    throw Error(`Expected a function, got: ${reader}`)
  }

  const last = global[key]
  const current = global[key] = []

  try {
    stop(reader)
    reader()
    current.forEach(readers => {
      add(readers, reader)
    })
    reader[lowkey] = current
  } finally {
    global[key] = last
  }

  return reader
}

exports.stop = stop
function stop (reader) {
  if (reader && reader[lowkey]) {
    reader[lowkey].splice(0).forEach(readers => {
      const index = readers.indexOf(reader)
      if (~index) readers.splice(index, 1)
    })
  }
}

/**
 * Beacon
 */

class Beacon {
  constructor () {
    this.readers = []
  }

  watch () {
    if (global[key]) add(global[key], this.readers)
  }

  trigger () {
    this.readers.splice(0).forEach(autorun)
  }
}
exports.Beacon = Beacon

/**
 * Reactive data source
 */

class Source {
  constructor (value) {
    this.beacon = new Beacon()
    this.value = value
  }

  read () {
    this.beacon.watch()
    return this.value
  }

  write (value) {
    this.value = value
    this.beacon.trigger()
  }
}
exports.Source = Source

/**
 * Utils
 */

function add (array, value) {
  if (!~array.indexOf(value)) array.push(value)
}
