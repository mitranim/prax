'use strict'

// Deprecated

const emerge = require('emerge')
const readAtPath = emerge.readAtPath
const mergeAtPath = emerge.mergeAtPath
const replaceAtPath = emerge.replaceAtPath

const lang = require('./lang')
const is = lang.is
const remove = lang.remove
const callEach = lang.callEach

exports.Atom = Atom
function Atom (init) {
  let next = replaceAtPath(undefined, init, [])
  let mean = next
  let prev = mean
  let writing = false
  let subs = []

  function read () {
    return readAtPath(mean, arguments)
  }

  function write () {
    writing = true
    prev = mean
    mean = next  // this is the actual write
    try {
      callEach(subs, prev, mean)
    } finally {
      writing = false
      if (!is(next, mean)) write()
    }
  }

  function set (path, value) {
    next = replaceAtPath(next, value, path)
    if (!writing) write()
  }

  function patch (path, value) {
    next = mergeAtPath(next, value, path)
    if (!writing) write()
  }

  function subscribe (func) {
    func(prev, mean)
    subs = subs.concat(func)
    return () => { subs = remove(subs, func) }
  }

  function watch (func) {
    return subscribe(Watcher(func))
  }

  return {read, set: set, patch, subscribe, watch}
}

/**
 * Utils
 */

exports.Watcher = Watcher
function Watcher (reader) {
  let paths
  return function watcher (prev, next) {
    if (!paths || changed(paths, prev, next)) {
      paths = runReader(reader, next)
    }
  }
}

function runReader (reader, value) {
  const paths = []
  reader(function read () {
    paths.push(arguments)
    return readAtPath(value, arguments)
  })
  return paths.slice()
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
