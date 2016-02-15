'use strict'

// TODO reconsider `watch` / `read`, rewrite in functional style.
// Also see `docs/scripts/effects # when`.

const readAtPath = require('emerge').readAtPath
const lang = require('./lang')
const is = lang.is
const apply = lang.apply
const isPlainObject = lang.isPlainObject

/**
 * Watching
 */

// Usage:
//   const when = When(watch)
//   when(read => read('...'), result => {/* ... */})
exports.When = When
function When (watch) {
  return function when () {
    return watch(apply(cond, arguments))
  }
}

// Usage:
//   function when (predicate, effect) {
//     return watch(cond(...arguments))
//   }
exports.cond = cond
function cond (predicate, effect) {
  let prev, next
  return function runCond (read) {
    prev = next
    next = predicate(read)
    if (next && !is(prev, next)) effect(next)
  }
}

// Usage:
//   const whenOneOf = WhenOneOf(subscribe)
//   ...
exports.WhenOneOf = WhenOneOf
function WhenOneOf (subscribe) {
  return function whenOneOf () {
    return subscribe(apply(collectionCond, arguments))
  }
}

// Usage:
//   function whenOneOf () {
//     return subscribe(collectionCond(...arguments))
//   }
exports.collectionCond = collectionCond
function collectionCond (path, predicate, effect) {
  return function runCollectionCond (prev, next) {
    prev = readAtPath(prev, path)
    next = readAtPath(next, path)
    if (is(prev, next)) return
    if (!isPlainObject(next)) return
    if (!isPlainObject(prev)) prev = {}
    for (const key in next) runCond(prev, next, key, predicate, effect)
  }
}

/**
 * Utils
 */

function runCond (prev, next, key, predicate, effect) {
  // base value: Boolean
  const nextValue = next[key]
  if (!nextValue) return

  // base value: change detection
  const prevValue = prev[key]
  if (is(prevValue, nextValue)) return

  // predicate result: Boolean
  const result = predicate(nextValue, key)
  if (!result) return

  // predicate result: change detection
  if (prevValue && is(predicate(prevValue, key), result)) return

  // invoke
  effect(key, nextValue, result)
}
