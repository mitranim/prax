'use strict'

const emerge = require('emerge')
const mergeAt = emerge.mergeAt
const readAtPath = emerge.readAtPath

const lang = require('./lang')
const is = lang.is
const apply = lang.apply
const curry = lang.curry
const foldl = lang.foldl
const isFunction = lang.isFunction

/**
 * Public
 */

const mergeAtC = curry(mergeAt)

// Usage:
//   compute(['myCollection'], [['one'], ['other']], transformFunc)
exports.compute = compute
function compute (path, sources, func) {
  return (prev, next) => ifChanged(
    readAll(prev, sources),
    readAll(next, sources),
    func,
    mergeAtC(path, next),
    next
  )
}

/**
 * Utils
 */

function ifChanged (left, right, func, out, def) {
  return !shallowEqual(left, right) ? out(apply(func, right)) : def
}

function readAll (value, sources) {
  const buffer = []
  for (let i = -1; ++i < sources.length;) {
    let source = sources[i]
    while (isFunction(source)) source = apply(source, buffer)
    buffer.push(readAtPath(value, source))
  }
  return buffer
}

function shallowEqual (left, right) {
  return foldl(left, eq, right)
}

function eq (acc, value, index) {
  return acc && is(value, acc[index]) ? acc : null
}
