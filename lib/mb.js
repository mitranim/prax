'use strict'

// Deprecated

const toTest = require('./pattern').toTest
const lang = require('./lang')
const slice = lang.slice
const remove = lang.remove

exports.Mb = Mb
function Mb () {
  let subs = []

  function send (msg) {
    sendStatic(subs, msg)
  }

  function match (pattern, func) {
    if (typeof func !== 'function') throw Error(`Expected a function, got: ${func}`)
    return subscribe({test: toTest(pattern), func})
  }

  function subscribe (sub) {
    subs = subs.concat(sub)
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
  if (!matched && typeof console !== 'undefined') {
    console.warn('Discarding unmatched message:', msg)
  }
}
