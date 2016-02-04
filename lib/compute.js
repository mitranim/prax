'use strict'

const emerge = require('emerge')
const mergeAt = emerge.mergeAt
const readAtPath = emerge.readAtPath

const lang = require('./lang')
const is = lang.is
const foldl = lang.foldl
const curry = lang.curry
const apply = lang.apply
const isFunction = lang.isFunction

/**
 * Public
 */

const mergeAtC = curry(mergeAt)

// Usage:
//   compute(['myCollection'], [['otherCollection']], transformFunc)
exports.compute = compute
function compute (path, sources, func) {
  return (prev, next) => ifChanged(
    readAll(prev, sources),
    readAll(next, sources),
    func,
    mergeAtC(next, path),
    next
  )
}

/**
 * Utils
 */

function ifChanged (left, right, func, out, def) {
  return !shallowEqual(left, right) ? out(apply(func, right)) : def
}

const readOne = curry(function readOne (value, source) {
  return isFunction(source)
    ? readOne(value, source(value))
    : readAtPath(value, source)
})

function readAll (value, sources) {
  return sources.map(readOne(value))
}

function shallowEqual (left, right) {
  return foldl(left, eq, right)
}

function eq (acc, value, index) {
  return acc && is(value, acc[index]) ? acc : null
}
