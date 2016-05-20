'use strict'

const {readAt} = require('emerge')

const {is, bind, pipe, defer, spread, someWith, isFunction} = require('./lang')

const {pass} = require('./reduce')

exports.readAll = readAll
function readAll (sources, value) {
  return mapWithLast(resolve, sources, value)
}

exports.give = give
function give (sources, func) {
  return pipe(pass, bind(readAll, sources), spread(func))
}

exports.pathsChanged = pathsChanged
function pathsChanged (paths, prev, next) {
  return someWith(pathChanged, paths, prev, next)
}

exports.changed = defer(pathsChanged)

/**
 * Utils
 */

function resolve (source, last, value) {
  return readAt(isFunction(source) ? source(last) : source, value)
}

function mapWithLast (func, list, a, b) {
  const out = []
  for (let i = -1; ++i < list.length;) out.push(func(list[i], out[i - 1], a, b))
  return out
}

function pathChanged (path, _, prev, next) {
  return !is(readAt(path, prev), readAt(path, next))
}
