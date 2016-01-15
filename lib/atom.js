'use strict'

const emerge = require('emerge')
const readAtPath = emerge.readAtPath
const mergeAtPath = emerge.mergeAtPath
const replaceAtPath = emerge.replaceAtPath

exports.createAtom = createAtom
function createAtom (init) {
  let mean = replaceAtPath(undefined, init, [])
  let prev = mean
  let next = mean
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
      subs.forEach(run)
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

  function run (func) {
    func(prev, mean)
  }

  function subscribe (func) {
    run(func)
    subs = subs.concat(func)
    return () => { subs = remove(subs, func) }
  }

  function watch (func) {
    return subscribe(watcher(func))
  }

  return {read, set: set, patch, subscribe, watch}
}

exports.watcher = watcher
function watcher (func) {
  if (typeof func !== 'function') throw Error(`Expected a function, got: ${func}`)
  let paths

  return function runWatcher (prev, next) {
    if (!paths || paths.some(changed(prev, next))) {
      paths = []
      func(function read () {
        paths.push(arguments)
        return readAtPath(next, arguments)
      })
    }
  }
}

/**
 * Utils
 */

function is (one, other) {
  return one === other || one !== one && other !== other  // eslint-disable-line
}

function changed (prev, next) {
  return function detectChange (path) {
    return !is(readAtPath(prev, path), readAtPath(next, path))
  }
}

function remove (array, value) {
  const index = array.indexOf(value)
  if (~index) array = array.slice(), array.splice(index, 1)  // eslint-disable-line
  return array
}
