'use strict'

const readAtPath = require('emerge').readAtPath
const deepEqual = require('emerge').deepEqual
const join = Array.prototype.join

exports.createAtom = createAtom
function createAtom (lastState) {
  const key = typeof Symbol === 'function' ? Symbol() : (Math.random() * Math.pow(10, 18)).toString(16)
  const funcsByPath = Object.create(null)
  let currentPaths

  function read () {
    if (currentPaths) add(currentPaths, join.call(arguments, '\0'))
    return readAtPath(lastState, arguments)
  }

  function write (nextState) {
    const paths = changedPaths(lastState, nextState, Object.keys(funcsByPath))
    lastState = nextState
    notify(paths)
  }

  function notify (paths) {
    const funcsToNotify = []

    paths.forEach(path => {
      const funcs = funcsByPath[path]
      if (!funcs) return
      if (!funcs.length) return delete funcsByPath[path]
      funcs.forEach(func => {add(funcsToNotify, func)})
    })

    funcsToNotify.forEach(watch)
  }

  function watch (func) {
    if (typeof func !== 'function') {
      throw Error(`Expected a function, got: ${func}`)
    }

    const lastPaths = currentPaths
    currentPaths = []

    try {
      stop(func)
      func(read)
      currentPaths.forEach(path => {
        const funcs = funcsByPath[path] || (funcsByPath[path] = [])
        add(funcs, func)
      })
      func[key] = currentPaths
    } finally {
      currentPaths = lastPaths
    }

    return func
  }

  function stop (func) {
    if (!func || !func[key]) return
    func[key].splice(0).forEach(path => {
      if (funcsByPath[path]) remove(funcsByPath[path], func)
    })
  }

  return {read, write, watch, stop}
}

/**
 * Utils
 */

function add (array, value) {
  if (!~array.indexOf(value)) array.push(value)
}

function remove (array, value) {
  const index = array.indexOf(value)
  if (~index) array.splice(index, 1)
}

function changedPaths (prev, next, paths) {
  return paths.filter(path => eq(prev, next, path ? path.split('\0') : []))
}

function eq (prev, next, path) {
  const one = readAtPath(prev, path)
  const other = readAtPath(next, path)
  if (isMutable(one) || isMutable(other)) return !deepEqual(one, other)
  // When dealing with immutable objects, assume they were produced by `emerge`
  // and can be compared with `===`. This allows us to skip lots of tree walks.
  return !is(one, other)
}

function isMutable (value) {
  return value !== null && typeof value === 'object' && !Object.isFrozen(value)
}

function is (one, other) {
  return one === other || one !== one && other !== other  // eslint-disable-line
}
