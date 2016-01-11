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
  let subs = []

  function send (msg) {
    sendStatic(subs, msg)
  }

  function match (pattern, func) {
    if (typeof func !== 'function') throw Error(`Expected a function, got: ${func}`)
    const sub = {test: toTest(pattern), func}
    subs = subs.concat(sub)
    return () => { subs = remove(subs, sub) }
  }

  const args = slice.call(arguments)
  while (args.length) match(args.shift(), args.shift())

  return {send, match}
}

/**
 * Utils
 */

exports.toTest = toTest
function toTest (pattern) {
  if (typeof pattern === 'function') return pattern
  if (isReallyNaN(pattern)) return isReallyNaN
  if (!isObject(pattern)) return value => value === pattern
  if (pattern instanceof RegExp) return pattern.test.bind(pattern)
  return objectToTest(pattern)
}

function objectToTest (pattern) {
  const pairs = Object.keys(pattern).map(key => ({key, test: toTest(pattern[key])}))
  return value => (
    isObject(value) && pairs.every(pair => pair.test.call(null, value[pair.key]))
  )
}

function isObject (value) {
  return value !== null && typeof value === 'object'
}

function isReallyNaN (value) {
  return value !== value  // eslint-disable-line
}

function remove (array, value) {
  const index = array.indexOf(value)
  return !~index ? array : array.slice(0, index).concat(array.slice(index + 1))
}

function sendStatic (subs, msg) {
  let matched = false
  subs.forEach(sub => {
    if (sub.test.call(null, msg)) {
      matched = true
      sub.func.call(null, msg)
    }
  })
  if (!matched && typeof console !== 'undefined') {
    console.warn('Discarding unmatched message:', msg)
  }
}
