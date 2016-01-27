'use strict'

const emerge = require('emerge')
const readAtPath = emerge.readAtPath
const mergeAtPath = emerge.mergeAtPath
const replaceAtPath = emerge.replaceAtPath

const createEventLoop = require('./event-loop').createEventLoop

const pure = require('./atom-pure')
const fromValue = pure.fromValue
const swapValue = pure.swapValue
const sub = pure.subscribe
const unsub = pure.unsubscribe

/**
 * Minimal
 */

function createSimpleAtom (init) {
  let atom = fromValue(init)

  function read () {
    return readAtPath(atom.mean, arguments)
  }

  function swap (value) {
    atom = swapValue(atom, value)
    notify(atom)
  }

  function subscribe (func) {
    func(atom.prev, atom.mean)
    atom = sub(atom, func)
    return () => { atom = unsub(atom, func) }
  }

  return {read, swap, subscribe}
}

/**
 * Extended
 */

exports.createAtom = createAtom
function createAtom (init) {
  const atom = createSimpleAtom(replaceAtPath(undefined, init, []))
  const enqueue = createEventLoop(atom.swap)
  let next = atom.read()

  function write (func, value, path) {
    next = func(next, value, path)
    enqueue(next)
  }

  function set (path, value) {
    write(replaceAtPath, value, path)
  }

  function patch (path, value) {
    write(mergeAtPath, value, path)
  }

  function watch (func) {
    return atom.subscribe(createWatcher(func))
  }

  return {read: atom.read, set: set, patch, subscribe: atom.subscribe, watch}
}

/**
 * Utils
 */

// Pure

function is (one, other) {
  return one === other || one !== one && other !== other  // eslint-disable-line
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

// Tainted

function notify (atom) {
  callEach(atom.subs, atom.prev, atom.mean)
}

function callEach (funcs, left, right) {
  for (let i = -1; ++i < funcs.length;) funcs[i](left, right)
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
