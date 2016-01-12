'use strict'

const readAtPath = require('emerge').readAtPath
const toTest = require('./pattern').toTest

exports.findPaths = findPaths
function findPaths (value, query) {
  if (!query.length) return [[]]
  if (!isObject(value)) return []

  const test = toTest(query[0])
  const keys = Object.keys(value).filter(test)
  query = query.slice(1)

  return keys.map(key => (
    findPaths(value[key], query).map(path => [key].concat(path))
  )).reduce(concat, [])
}

exports.queryWatcher = queryWatcher
function queryWatcher (query, func) {
  if (!(query instanceof Array)) {
    throw Error(`Expected query to be an array, got: ${query}`)
  }
  if (typeof func !== 'function') throw Error(`Expected a function, got: ${func}`)

  return (prev, next) => {
    findPaths(next, query).filter(changed(prev, next)).forEach(path => {
      func(path, readAtPath(prev, path), readAtPath(next, path))
    })
  }
}

/**
 * Utils
 */

function isObject (value) {
  return value !== null && typeof value === 'object'
}

function is (one, other) {
  return one === other || one !== one && other !== other  // eslint-disable-line
}

function changed (prev, next) {
  return path => (
    !is(readAtPath(prev, path), readAtPath(next, path))
  )
}

function concat (array, value) {
  return array.concat(value)
}
