'use strict'

const readAtPath = require('emerge').readAtPath
const deepEqual = require('emerge').deepEqual
const join = Array.prototype.join

exports.createAtom = createAtom
function createAtom (lastState) {
  const key = typeof Symbol === 'function' ? Symbol() : (Math.random() * Math.pow(10, 16)).toString(16)
  const funcsByPath = Object.create(null)
  let currentPaths

  function read () {
    if (currentPaths) add(currentPaths, join.call(arguments, '.'))
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
      const funcs = funcsByPath[path]
      if (!funcs) return
      const index = funcs.indexOf(func)
      if (~index) funcs.splice(index, 1)
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

function changedPaths (prev, next, paths) {
  return paths.filter(path => {
    if (!path) return !deepEqual(prev, next)
    const fullPath = path.split('.')
    return !deepEqual(readAtPath(prev, fullPath), readAtPath(next, fullPath))
  })
}
