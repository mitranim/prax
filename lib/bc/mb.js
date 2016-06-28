'use strict'

/**
 * DEPRECATED
 */

const {test, slice, append, remove, isFunction} = require('fpx')

exports.Mb = Mb
function Mb () {
  let subs = []

  function send (msg) {
    sendStatic(subs, msg)
  }

  function match (pattern, fun) {
    if (!isFunction(fun)) throw Error(`Expected a function, got: ${fun}`)
    return subscribe({test: test(pattern), fun})
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
      sub.fun.call(null, msg)
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
