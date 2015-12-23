'use strict'

const readAtPath = require('emerge').readAtPath
const join = [].join

exports.createAtom = createAtom
function createAtom (currentState) {
  // Would prefer WeakMap
  const key = (Math.random() * Math.pow(10, 18)).toString(16)
  const funcsByPath = Object.create(null)
  let currentPaths

  function read () {
    if (currentPaths) add(currentPaths, join.call(arguments, '\0'))
    return readAtPath(currentState, arguments)
  }

  function write (nextState) {
    const funcs = funcsToNotify(funcsByPath, currentState, nextState)
    currentState = nextState
    notify(funcs)
  }

  function notify (funcs) {
    each(funcs, func => {
      // Ignore if the func was stopped mid-flight.
      if (func[key] && !func[key].length) return
      watch(func)
    })
  }

  function watch (func) {
    if (typeof func !== 'function') {
      throw Error(`Expected a function, got: ${func}`)
    }

    const lastPaths = currentPaths
    currentPaths = []

    try {
      stop(func)
      func()
      each(currentPaths, path => {
        const funcs = (funcsByPath[path] || (funcsByPath[path] = createNode(path))).funcs
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
    each(func[key].splice(0), path => {
      const node = funcsByPath[path]
      if (node) {
        remove(node.funcs, func)
        if (!node.funcs.length) delete funcsByPath[path]
      }
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

function each (value, func) {
  for (let i = -1; ++i < value.length;) func(value[i], i)
}

// Assumes that the tree was merged using `emerge`, and objects can be compared
// with `===`.
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
