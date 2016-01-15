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

const toTest = require('./pattern').toTest

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

  const args = [].slice.call(arguments)
  while (args.length) match(args.shift(), args.shift())

  return {send, match}
}

/**
 * Utils
 */

function sendStatic (subs, msg) {
  let matched = false
  subs.forEach(function runSub (sub) {
    if (sub.test.call(null, msg)) {
      matched = true
      sub.func.call(null, msg)
    }
  })
  if (!matched && typeof console !== 'undefined') {
    console.warn('Discarding unmatched message:', msg)
  }
}

function remove (array, value) {
  const index = array.indexOf(value)
  if (~index) array = array.slice(), array.splice(index, 1)  // eslint-disable-line
  return array
}
