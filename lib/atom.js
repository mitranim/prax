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

exports.createAtom = createAtom
function createAtom (init) {
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
    return subscribe(createWatcher(func))
  }

  return {read, set: set, patch, subscribe, watch}
}

/**
 * Utils
 */

function pathChanged (path, prev, next) {
  return !is(readAtPath(prev, path), readAtPath(next, path))
}

function somePathsChanged (paths, prev, next) {
  for (let i = -1; ++i < paths.length;) {
    if (pathChanged(paths[i], prev, next)) return true
  }
  return false
}

exports.createWatcher = createWatcher
function createWatcher (reader) {
  let paths
  return function watcher (prev, next) {
    if (!paths || somePathsChanged(paths, prev, next)) {
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
