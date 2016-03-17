'use strict'

const readAt = require('emerge').readAt
const lang = require('./lang')
const is = lang.is
const pipe = lang.pipe

exports.Watch = subscribe => pipe(Watcher, subscribe)

exports.WatchNow = WatchNow
function WatchNow (app) {
  return function watchNow (reader) {
    const watcher = Watcher(reader)
    watcher(app.getPrev(), app.getMean())
    return app.addEffect(watcher)
  }
}

exports.Watcher = Watcher
function Watcher (reader) {
  let paths
  return function watcher (prev, next) {
    if (!paths || changed(paths, prev, next)) {
      const result = runReader(reader, next, paths = [])
      paths = paths.slice()
      return result
    }
  }
}

/**
 * Utils
 */

// Note: this function mutates a value that crosses function boundaries
// (`paths`). It's an antipattern we want to avoid as much as possible.
function runReader (reader, value, paths) {
  return reader(function read () {
    paths.push(arguments)
    return readAt(arguments, value)
  })
}

function changed (paths, prev, next) {
  return someWith(paths, changedOne, prev, next)
}

function changedOne (path, left, right) {
  return !is(readAt(path, left), readAt(path, right))
}

function someWith (list, test, a, b) {
  for (let i = -1; ++i < list.length;) if (test(list[i], a, b)) return true
  return false
}
