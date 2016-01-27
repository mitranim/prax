'use strict'

// Usage:
//   function compute () {
//     return watch(computer(...arguments))
//   }
exports.computer = computer
function computer (write, path, func) {
  return function runCompute (read) {
    write(path, func(read))
  }
}

// Usage:
//   function recomputer () {
//     return watch(computer(...arguments))
//   }
exports.recomputer = recomputer
function recomputer (write, path, func) {
  return function runRecompute (read) {
    const next = read.apply(null, path)
    if (isPlainObject(next)) {
      write(path, mapValuesToReader(next, func, read))
    }
  }
}

/**
 * Utils
 */

function isPlainObject (value) {
  return value != null && typeof value === 'object' &&
    (value.constructor === Object || !('constructor' in value))
}

function mapValuesToReader (object, func, read) {
  const buffer = {}
  for (const key in object) buffer[key] = func(read, key, object[key])
  return buffer
}
