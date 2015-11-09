'use strict'

let current
const key = typeof Symbol === 'function' ? Symbol() : (Math.random() * Math.pow(10, 16)).toString(16)

/**
 * Tracking
 */

exports.autorun = autorun
function autorun (reader) {
  if (typeof reader !== 'function') {
    throw Error(`Expected a function, got: ${reader}`)
  }

  const last = current
  current = []

  try {
    stop(reader)
    reader()
    current.forEach(readers => {
      add(readers, reader)
    })
    reader[key] = current
  } finally {
    current = last
  }

  return reader
}

exports.stop = stop
function stop (reader) {
  if (reader && reader[key]) {
    reader[key].splice(0).forEach(readers => {
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
    if (current) add(current, this.readers)
  }

  trigger () {
    this.readers.splice(0).forEach(reader => {
      if (reader[key] && ~reader[key].indexOf(this.readers)) autorun(reader)
    })
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
