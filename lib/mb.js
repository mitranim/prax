'use strict'

/**
 * DEPRECATED
 */

const test = require('./pattern').test
const lang = require('./lang')
const slice = lang.slice
const append = lang.append
const remove = lang.remove
const isFunction = lang.isFunction

exports.Mb = Mb
function Mb () {
  let subs = []

  function send (msg) {
    sendStatic(subs, msg)
  }

  function match (pattern, func) {
    if (!isFunction(func)) throw Error(`Expected a function, got: ${func}`)
    return subscribe({test: test(pattern), func})
  }

  function subscribe (sub) {
    subs = append(subs, sub)
    return () => { subs = remove(subs, sub) }
  }

  const args = slice(arguments)
  while (args.length) match(args.shift(), args.shift())

  return {send, match}
}

function sendStatic (subs, msg) {
  let matched = false
  subs.forEach(function runSub (sub) {
    if (sub.test.call(null, msg)) {
      matched = true
      sub.func.call(null, msg)
    }
  })

  /* #if TESTING
  const warn = console.warn
  console.warn = () => {}
  #endif */
  if (!matched && typeof console !== 'undefined') {
    console.warn('Discarding unmatched message:', msg)
  }
  /* #if TESTING
  console.warn = warn
  #endif */
}
