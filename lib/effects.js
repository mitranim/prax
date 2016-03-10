'use strict'

const readAtPath = require('emerge').readAtPath

const lang = require('./lang')
const is = lang.is
const apply = lang.apply
const someWith = lang.someWith
const mapObject = lang.mapObject
const isPlainObject = lang.isPlainObject

const readAll = require('./compute').readAll

const Watcher = require('./watch').Watcher

/**
 * Effects
 */

exports.where = where
function where (paths, predicate, effect) {
  return (prev, next) => {
    if (pathsChanged(paths, prev, next)) {
      const values = readAll(next, paths)
      const test = apply(predicate, values)
      if (test && !is(apply(predicate, readAll(prev, paths)), test)) {
        return apply(effect, values)
      }
    }
  }
}

exports.when = when
function when () {
  return Watcher(apply(cond, arguments))
}

exports.whenOneOf = whenOneOf
function whenOneOf () {
  return apply(collectionCond, arguments)
}

/**
 * Watchers (deprecated?)
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
    if (next && !is(prev, next)) return effect(next)
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

    return mapObject(next, (value, key) => (
      runCond(value, key, prev, predicate, effect)
    ))
  }
}

/**
 * Utils
 */

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

  // invoke
  return effect(key, nextValue, result)
}

exports.pathsChanged = pathsChanged
function pathsChanged (paths, prev, next) {
  return someWith(paths, pathChanged, prev, next)
}

function pathChanged (path, _, prev, next) {
  return !is(readAtPath(prev, path), readAtPath(next, path))
}
