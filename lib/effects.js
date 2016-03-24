'use strict'

const readAt = require('emerge').readAt

const lang = require('./lang')
const is = lang.is
const bind = lang.bind
const pipe = lang.pipe
const spread = lang.spread
const ifthen = lang.ifthen
const someWith = lang.someWith
const mapObject = lang.mapObject
const isPlainObject = lang.isPlainObject

const readAll = require('./compute').readAll

const Watcher = require('./watch').Watcher

const toTest = require('./pattern').toTest

const pass = require('./reduce').pass

/**
 * Effects (reactive)
 */

exports.where = where
function where (paths, predicate, effect) {
  return ifthen(
    bind(pathsChanged, paths),
    pipe(pass, bind(readAll, paths), spread(ifthen(predicate, effect)))
  )
}

exports.when = pipe(cond, Watcher)

exports.whenOneOf = collectionCond

exports.match = match
function match (pattern, effect) {
  return _match(toTest(pattern), effect)
}

function _match (test, effect) {
  return (_, next, event) => test(event) ? effect(event, next) : undefined
}

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

function collectionCond (path, predicate, effect) {
  return function runCollectionCond (prev, next) {
    prev = readAt(path, prev)
    next = readAt(path, next)

    if (is(prev, next)) return
    if (!isPlainObject(next)) return
    if (!isPlainObject(prev)) prev = {}

    return mapObject((value, key) => (
      runCond(value, key, prev, predicate, effect)
    ), next)
  }
}

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

exports.pathsChanged = pathsChanged
function pathsChanged (paths, prev, next) {
  return someWith(pathChanged, paths, prev, next)
}

function pathChanged (path, _, prev, next) {
  return !is(readAt(path, prev), readAt(path, next))
}
