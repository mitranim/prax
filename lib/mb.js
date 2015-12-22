'use strict'

const slice = [].slice

exports.createMb = createMb
function createMb () {
  const subs = []

  function send (msg) {sendStatic(subs, msg)}
  function match (pattern, func) {return matchStatic(subs, pattern, func)}

  const args = slice.call(arguments)
  while (args.length) match(args.shift(), args.shift())

  return {send, match}
}

/**
 * Utils
 */

function validateFunc (func) {
  if (typeof func !== 'function') {
    throw Error(`Expected a function, got: ${func}`)
  }
}

/* #if TESTING
exports.toTest = toTest
#endif TESTING */
function toTest (pattern) {
  if (typeof pattern === 'function') return pattern
  if (isNaNForReal(pattern)) return isNaNForReal
  if (!isObject(pattern)) return value => value === pattern
  return objectToTest(pattern)
}

function objectToTest (pattern) {
  const test = Object.keys(pattern).map(key => ({key, test: toTest(pattern[key])}))
  return value => isObject(value) && test.every(pair => pair.test(value[pair.key]))
}

function isObject (value) {
  return value !== null && typeof value === 'object'
}

function isNaNForReal (value) {
  return value !== value  // eslint-disable-line
}

function remove (array, value) {
  const index = array.indexOf(value)
  if (~index) array.splice(index, 1)
}

function sendStatic (subs, msg) {
  let matched = false
  subs.slice().forEach(sub => {
    if (sub.test.call(null, msg)) {
      matched = true
      sub.func.call(null, msg)
    }
  })
  if (!matched) {
    console.warn('Discarding unmatched message:', msg)
  }
}

function matchStatic (subs, pattern, func) {
  validateFunc(func)
  const sub = {test: toTest(pattern), func}
  subs.push(sub)
  return () => {remove(subs, sub)}
}
