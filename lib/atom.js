'use strict'

const emerge = require('emerge')
const readAtPath = emerge.readAtPath
const immute = emerge.immute
const replaceAtPath = emerge.replaceAtPath
const mergeAtPath = emerge.mergeAtPath
const join = [].join

exports.createAtom = createAtom
function createAtom (currentState, strategy) {
  // Would prefer WeakMap
  const key = (Math.random() * Math.pow(10, 18)).toString(16)
  const funcsByPath = Object.create(null)

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
    const funcs = funcsToNotify(funcsByPath, prevState, currentState)
    prevState = currentState
    each(funcs, func => {
      // Ignore if the func was stopped mid-flight.
      if (func[key] && !func[key].length) return
      watch(func)
    })
  }

  if (typeof strategy === 'function') notify = strategy(notify)  // eslint-disable-line

  function watch (func) {
    if (typeof func !== 'function') {
      throw Error(`Expected a function, got: ${func}`)
    }

    stop(func)

    const paths = []

    func(function read () {
      add(paths, join.call(arguments, '\0'))
      return readAtPath(currentState, arguments)
    })

    each(paths, path => {
      const funcs = (funcsByPath[path] || (funcsByPath[path] = createNode(path))).funcs
      add(funcs, func)
    })

    func[key] = paths

    return func
  }

  function stop (func) {
    if (!func || !func[key]) return
    each(func[key].splice(0), path => {
      const node = funcsByPath[path]
      if (node) {
        remove(node.funcs, func)
        if (!node.funcs.length) delete funcsByPath[path]
      }
    })
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

function each (value, func) {
  for (let i = -1; ++i < value.length;) func(value[i], i)
}

function funcsToNotify (funcsByPath, prev, next) {
  const funcs = []
  each(Object.keys(funcsByPath), key => {
    const node = funcsByPath[key]
    if (!is(readAtPath(prev, node.path), readAtPath(next, node.path))) {
      each(node.funcs, func => {add(funcs, func)})
    }
  })
  return funcs
}

function is (one, other) {
  return one === other || one !== one && other !== other  // eslint-disable-line
}

function createNode (path) {
  return {funcs: [], path: path ? path.split('\0') : []}
}
