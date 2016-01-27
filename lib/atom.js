'use strict'

const emerge = require('emerge')
const readAtPath = emerge.readAtPath
const mergeAtPath = emerge.mergeAtPath
const replaceAtPath = emerge.replaceAtPath

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

function is (one, other) {
  return one === other || one !== one && other !== other  // eslint-disable-line
}

function remove (array, value) {
  const index = array.indexOf(value)
  if (~index) array = array.slice(), array.splice(index, 1)  // eslint-disable-line
  return array
}

function callEach (funcs, left, right) {
  for (let i = -1; ++i < funcs.length;) funcs[i](left, right)
}

function pathChanged (path, prev, next) {
  return !is(readAtPath(prev, path), readAtPath(next, path))
}

function somePathsChanged (paths, prev, next) {
  for (let i = -1; ++i < paths.length;) {
    if (pathChanged(paths[i], prev, next)) return true
  }
  return false
}

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
