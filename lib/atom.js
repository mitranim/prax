'use strict'

const emerge = require('emerge')
const readAtPath = emerge.readAtPath
const immute = emerge.immute
const replaceAtPath = emerge.replaceAtPath
const mergeAtPath = emerge.mergeAtPath

exports.createAtom = createAtom
function createAtom (currentState, strategy) {
  // Would prefer Map and/or WeakMap
  const key = (Math.random() * Math.pow(10, 18)).toString(16)
  const funcs = []

  currentState = immute(currentState)
  let prevState = currentState

  function read () {
    return readAtPath(currentState, arguments)
  }

  function set (path, value) {
    currentState = replaceAtPath(currentState, value, path)
    notify()
  }

  function patch (path, value) {
    currentState = mergeAtPath(currentState, value, path)
    notify()
  }

  function notify () {
    const subs = funcs.filter(func => func[key] && func[key].some(path => {
      return !is(readAtPath(prevState, path), readAtPath(currentState, path))
    }))

    prevState = currentState

    subs.forEach(func => {
      // Ignore if the func was stopped mid-flight.
      if (~funcs.indexOf(func)) watch(func)
    })
  }

  if (typeof strategy === 'function') notify = strategy(notify)  // eslint-disable-line

  function watch (func) {
    if (typeof func !== 'function') {
      throw Error(`Expected a function, got: ${func}`)
    }

    const paths = []

    func(function read () {
      paths.push(arguments)
      return readAtPath(prevState, arguments)
    })

    func[key] = paths

    add(funcs, func)

    return func
  }

  function stop (func) {
    remove(funcs, func)
  }

  return {read, set: set, patch, watch, stop}  // eslint-disable-line
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

function is (one, other) {
  return one === other || one !== one && other !== other  // eslint-disable-line
}
