'use strict'

const {readAt} = require('emerge')

const {is, bind, pipe, ifthen, mapObject, isPlainObject} = require('./lang')

const {give, changed, pathsChanged} = require('./compare')

const {Watcher} = require('./watch')

const {test} = require('./pattern')

/**
 * Effects (reactive)
 */

exports.where = where
function where (paths, predicate, effect) {
  return ifthen(
    changed(paths),
    give(paths, ifthen(predicate, effect))
  )
}

exports.when = pipe(cond, Watcher)

exports.whenOneOf = collectionCond

exports.match = match
function match (pattern, effect) {
  return _match(test(pattern), effect)
}

function _match (test, effect) {
  return (_, next, event) => test(event) ? effect(event, next) : undefined
}

// Backwards compatibility.
exports.pathsChanged = pathsChanged

/**
 * DEPRECATED
 *
 * Watchers (proactive)
 */

// Usage:
//   const when = When(watch)
//   when(read => read('...'), result => {/* ... */})
exports.When = bind(pipe, cond)

// Usage:
//   const whenOneOf = WhenOneOf(subscribe)
//   ...
exports.WhenOneOf = bind(pipe, collectionCond)

/**
 * Utils
 */

function cond (predicate, effect) {
  let prev, next
  return function runCond (read) {
    prev = next
    next = predicate(read)
    if (next && !is(prev, next)) return effect(next)
  }
}

// TODO rewrite functionally.
function collectionCond (path, predicate, effect) {
  return function runCollectionCond (prev, next) {
    prev = readAt(path, prev)
    next = readAt(path, next)

    if (is(prev, next)) return
    if (!isPlainObject(next)) return
    if (!isPlainObject(prev)) prev = {}

    return mapObject((value, key) => (
      runCond(value, key, prev, predicate, effect)
    ), next).filter(Boolean)
  }
}

// TODO rewrite functionally.
function runCond (nextValue, key, prev, predicate, effect) {
  // base value: non-nil
  if (nextValue == null) return

  // base value: change detection
  const prevValue = prev[key]
  if (is(prevValue, nextValue)) return

  // predicate result: Boolean
  const result = predicate(nextValue, key)
  if (!result) return

  // predicate result: change detection
  if (prevValue && is(predicate(prevValue, key), result)) return

  return effect(key, nextValue, result)
}
