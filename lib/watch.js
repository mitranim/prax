'use strict'

const readAt = require('emerge').readAt
const lang = require('./lang')
const is = lang.is
const bind = lang.bind
const pipe = lang.pipe
const someWith = lang.someWith

// Note: a watcher maintains state and shares intentionally mutable data with
// other functions. It's a double antipattern. We want to avoid this in other
// utilities.
exports.Watcher = Watcher
function Watcher (reader) {
  let paths
  return function watcher (prev, next) {
    if (!paths || changed(paths, prev, next)) {
      paths = []
      const result = reader(Read(paths, next))
      // Avoid further mutations.
      paths = paths.slice()
      return result
    }
  }
}

exports.Watch = bind(pipe, Watcher)

exports.WatchNow = WatchNow
function WatchNow (app) {
  return function watchNow (reader) {
    const watcher = Watcher(reader)
    watcher(app.getPrev(), app.getMean())
    return app.addEffect(watcher)
  }
}

/**
 * Utils
 */

// Note: this function mutates a value that crosses function boundaries
// (`paths`). It's an antipattern we want to avoid as much as possible.
function Read (paths, value) {
  return function read () {
    paths.push(arguments)
    return readAt(arguments, value)
  }
}

function changed (paths, prev, next) {
  return someWith(changedOne, paths, prev, next)
}

function changedOne (path, _, left, right) {
  return !is(readAt(path, left), readAt(path, right))
}
