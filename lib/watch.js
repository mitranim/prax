'use strict'

const readAtPath = require('emerge').readAtPath
const lang = require('./lang')
const is = lang.is
const pipe = lang.pipe

exports.Watch = addEffect => pipe(Watcher, addEffect)

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
// (`paths`). It's an antipattern we want to move away from.
function runReader (reader, value, paths) {
  return reader(function read () {
    paths.push(arguments)
    return readAtPath(value, arguments)
  })
}

function changed (paths, prev, next) {
  return someWith(paths, changedOne, prev, next)
}

function changedOne (path, left, right) {
  return !is(readAtPath(left, path), readAtPath(right, path))
}

function someWith (list, test, a, b) {
  for (let i = -1; ++i < list.length;) if (test(list[i], a, b)) return true
  return false
}
