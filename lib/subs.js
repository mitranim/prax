'use strict'

const readAtPath = require('emerge').readAtPath
const toTest = require('./pattern').toTest

/**
 * Computation
 */

// Usage:
//   watch(computer(set|patch, path, func))
exports.computer = computer
function computer (write, path, func) {
  return function runCompute (read) {
    write(path, func(read))
  }
}

// Usage:
//   watch(computer(set|patch, path, func))
exports.recomputer = recomputer
function recomputer (write, path, func) {
  return function runRecompute (read) {
    const next = read.apply(null, path)
    if (isPlainObject(next)) {
      write(path, mapValues(next, function runRecomputeFunc (value, key) {
        return func(read, key, value)
      }))
    }
  }
}

/**
 * Watching
 */

// Usage:
//   watch(condMatcher(cond, pattern, func))
exports.condMatcher = condMatcher
function condMatcher (reader, pattern, func) {
  const test = toTest(pattern)
  return function runCond (read) {
    const value = reader(read)
    if (test(value)) func(value)
  }
}

// Usage:
//   subscribe(valueMatcher(path, subpath, pattern, func))
exports.valueMatcher = valueMatcher
function valueMatcher (path, subpath, pattern, func) {
  const readSub = pathReader(subpath)
  const test = toTest(pattern)

  return function runMatchValue (prev, next) {
    const prevValue = readAtPath(prev, path)
    const nextValue = readAtPath(next, path)
    if (is(prevValue, nextValue) || !isPlainObject(nextValue)) return

    const readPrev = isPlainObject(prevValue) ? keyReader(prevValue) : () => undefined

    function testKey (key) {
      const value = readSub(nextValue[key])
      return !is(readSub(readPrev(key)), value) && test(value)
    }

    function runMatchValueFunc (key) {
      func(key, readSub(nextValue[key]))
    }

    Object.keys(nextValue).filter(testKey).forEach(runMatchValueFunc)
  }
}

/**
 * Utils
 */

function is (one, other) {
  return one === other || one !== one && other !== other  // eslint-disable-line
}

function isPlainObject (value) {
  return value && (!('constructor' in value) || value.constructor === Object)
}

function pathReader (path) {
  return function reader (value) {
    return readAtPath(value, path)
  }
}

function keyReader (value) {
  return function readValue (key) {
    return value[key]
  }
}

function mapValues (object, func) {
  const buffer = {}
  Object.keys(object).forEach(key => {
    buffer[key] = func(object[key], key)
  })
  return buffer
}
