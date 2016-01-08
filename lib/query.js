'use strict'

const readAtPath = require('emerge').readAtPath

exports.findPaths = findPaths
function findPaths (value, query) {
  const buffer = []

  if (query.length && isObject(value)) {
    const key = query[0]
    const keys = typeof key === 'function'
      ? Object.keys(value).filter(key)
      : value.hasOwnProperty(key)
      ? [key]
      : []

    const rest = query.slice(1)

    keys.forEach(key => {
      if (rest.length) {
        const paths = findPaths(value[key], rest)
        buffer.push.apply(buffer, paths.map(path => [key].concat(path)))
      } else {
        buffer.push([key])
      }
    })
  } else if (!query.length) {
    buffer.push([])
  }

  return buffer
}

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
