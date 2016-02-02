'use strict'

const emerge = require('emerge')
const mergeAt = emerge.mergeAt
const readAtPath = emerge.readAtPath

const lang = require('./lang')
const is = lang.is
const foldl = lang.foldl
const curry = lang.curry
const apply = lang.apply
const readKey = lang.readKey
const isObject = lang.isObject
const mapValues = lang.mapValues
const isFunction = lang.isFunction
const isPlainObject = lang.isPlainObject

/**
 * Public
 */

const merge = curry(mergeAt)

// Usage:
//   compute(['myCollection'], [['otherCollection']], transformFunc)
exports.compute = compute
function compute (path, sources, func) {
  return (prev, next) => ifChanged(
    readAll(prev, sources),
    readAll(next, sources),
    func,
    merge(next, path),
    next
  )
}

const applyTo = curry(apply)

// Usage:
//   computeEach(
//     ['myCollection'],
//     [elem => ['otherCollection', elem.key]],
//     transformFunc
//   )
exports.computeEach = computeEach
function computeEach (path, sources, func) {
  return (prev, next) => mergeAt(next, path, mapValues(
    apply(changedArgs, readArgs(prev, next, path, sources)),
    applyTo(func)
  ))
}

/**
 * Utils
 */

// compute

function ifChanged (left, right, func, out, def) {
  return !shallowEqual(left, right) ? out(apply(func, right)) : def
}

const read = curry(readAtPath)

function readAll (value, sources) {
  return sources.map(read(value))
}

function shallowEqual (left, right) {
  return foldl(left, eq, right)
}

function eq (acc, value, index) {
  return acc && is(value, acc[index]) ? acc : null
}

// computeEach

// TODO rewrite without statements
function readArgs (prev, next, path, sources) {
  const argsNext = nextArgs(next, readAtPath(next, path), sources)
  const argsPrev = prevArgs(prev, readAtPath(prev, path), sources, Object.keys(argsNext))
  return [argsPrev, argsNext]
}

const scanOne = curry(function scanOne (state, value, key, source) {
  return isFunction(source)
    ? scanOne(state, value, key, source(value, key))
    : readAtPath(state, source)
})

const scan = curry(function scan (state, sources, value, key) {
  return [key, value].concat(
    isObject(value) ? sources.map(scanOne(state, value, key)) : []
  )
})

function nextArgs (state, collection, sources) {
  return isPlainObject(collection)
    ? mapValues(collection, scan(state, sources))
    : {}
}

function prevArgs (state, collection, sources, keys) {
  return isPlainObject(collection)
    ? mapValues(readKeys(collection, keys), scan(state, sources))
    : {}
}

function readKeys (value, keys) {
  const buffer = {}
  for (let i = -1; ++i < keys.length;) {
    buffer[keys[i]] = readKey(value, keys[i])
  }
  return buffer
}

function changedArgs (left, right) {
  const buffer = {}
  for (const key in right) {
    if (!shallowEqual(left[key], right[key])) buffer[key] = right[key]
  }
  return buffer
}
