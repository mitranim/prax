'use strict'

const emerge = require('emerge')
const readAtPath = emerge.readAtPath
const replaceAtPath = emerge.replaceAtPath
const mergeAtPath = emerge.mergeAtPath

exports.createAtom = createAtom
function createAtom (init) {
  let mean = replaceAtPath(undefined, init, [])
  let prev = mean
  let next = mean
  let phasing = false
  let subs = []

  function read () {
    return readAtPath(mean, arguments)
  }

  function write (writer) {
    next = writer(next)
    if (!phasing) phase()
  }

  function phase () {
    phasing = true
    prev = mean
    mean = next
    try {
      subs.forEach(run)
    } finally {
      phasing = false
      if (!is(next, mean)) phase()
    }
  }

  function set (path, next) {
    write(prev => replaceAtPath(prev, next, path))
  }

  function patch (path, next) {
    write(prev => mergeAtPath(prev, next, path))
  }

  function run (func) {
    func(prev, mean)
  }

  function monitor (func) {
    run(func)
    subs = subs.concat(func)
    return () => { subs = remove(subs, func) }
  }

  function watch (func) {
    return monitor(watcher(func))
  }

  return {read, set: set, patch, monitor, watch}
}

/**
 * Utils
 */

function remove (array, value) {
  const index = array.indexOf(value)
  return !~index ? array : array.slice(0, index).concat(array.slice(index + 1))
}

function is (one, other) {
  return one === other || one !== one && other !== other  // eslint-disable-line
}

function changed (prev, next) {
  return path => (
    !is(readAtPath(prev, path), readAtPath(next, path))
  )
}

exports.watcher = watcher
function watcher (func) {
  if (typeof func !== 'function') throw Error(`Expected a function, got: ${func}`)
  let paths

  return (prev, next) => {
    if (!paths || paths.some(changed(prev, next))) {
      paths = []
      func(function read () {
        paths.push(arguments)
        return readAtPath(next, arguments)
      })
    }
  }
}
