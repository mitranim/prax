'use strict'

/**
 * MB stands for _message bus_. It's a fancy event system with the following
 * characteristics:
 *   * synchronous
 *   * broadcast-only
 *   * pattern matching based
 *
 * The bus accepts single values called _messages_. Messages are identified by
 * their structure. Each listener (_factor_) is registered with a pattern, which
 * may be a function, a primitive value, or an object. Each broadcast checks all
 * pattern/factor pairs; when a pattern matches, the factor is called with the
 * message. More than one factor may be called. If none match, a warning is
 * printed.
 */

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

exports.toTest = toTest
function toTest (pattern) {
  if (typeof pattern === 'function') return pattern
  if (isNaNForReal(pattern)) return isNaNForReal
  if (!isObject(pattern)) return value => value === pattern
  return objectToTest(pattern)
}

function objectToTest (pattern) {
  const pairs = Object.keys(pattern).map(key => ({key, test: toTest(pattern[key])}))
  return function test (value) {
    return isObject(value) && pairs.every(pair => pair.test.call(this, value[pair.key]))
  }
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
