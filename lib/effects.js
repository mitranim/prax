'use strict'

const readAt = require('emerge').readAt

const lang = require('./lang')
const is = lang.is
const pipe = lang.pipe
const apply = lang.apply
const someWith = lang.someWith
const mapObject = lang.mapObject
const isFunction = lang.isFunction
const isPlainObject = lang.isPlainObject

const readAll = require('./compute').readAll

const Watcher = require('./watch').Watcher

const toTest = require('./pattern').toTest

/**
 * Effects (reactive)
 */

exports.where = where
function where (paths, predicate, effect) {
  return (prev, next) => {
    if (pathsChanged(paths, prev, next)) {
      const values = readAll(paths, next)
      const test = apply(predicate, values)
      if (test && !is(apply(predicate, readAll(paths, prev)), test)) {
        return apply(effect, values)
      }
    }
  }
}

exports.when = pipe(cond, Watcher)

exports.whenOneOf = collectionCond

/**
 * DEPRECATED
 *
 * Watchers (proactive)
 */

// Usage:
//   const when = When(watch)
//   when(read => read('...'), result => {/* ... */})
exports.When = When
function When (watch) {
  return pipe(cond, watch)
}

// Usage:
//   const whenOneOf = WhenOneOf(subscribe)
//   ...
exports.WhenOneOf = WhenOneOf
function WhenOneOf (subscribe) {
  return function whenOneOf () {
    return pipe(collectionCond, subscribe)
  }
}

/**
 * Utils
 */

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
    if (next && !is(prev, next)) return effect(next)
  }
}

// Usage:
//   function whenOneOf () {
//     return subscribe(collectionCond(...arguments))
//   }
exports.collectionCond = collectionCond
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
  // base value: Boolean
  if (!nextValue) return

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

exports.match = match
function match (pattern, effect) {
  return !isFunction(pattern)
    ? match(toTest(pattern), effect)
    : (_, next, event) => (
        pattern(event) ? effect(event, next) : undefined
      )
}
