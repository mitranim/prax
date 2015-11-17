'use strict'

const readAtPath = require('emerge').readAtPath
const deepEqual = require('emerge').deepEqual

const subsKey = typeof Symbol === 'function' ? Symbol() : (Math.random() * Math.pow(10, 16)).toString(16)

exports.createPrax = createPrax
function createPrax (lastState) {
  const subsTree = {}
  let pathsToSubscribe

  function autorun (func) {
    if (typeof func !== 'function') {
      throw Error(`Expected a function, got: ${func}`)
    }

    const lastPaths = pathsToSubscribe
    pathsToSubscribe = []

    try {
      func()
      each(pathsToSubscribe, path => {register(subsTree, path, func)})
    } finally {
      pathsToSubscribe = lastPaths
    }

    return func
  }

  function read () {
    if (pathsToSubscribe) add(pathsToSubscribe, arguments)
    return readAtPath(lastState, arguments)
  }

  function write (nextState) {
    const subs = []
    collectChanges(subs, subsTree, lastState, nextState)
    lastState = nextState
    each(subs, autorun)
  }

  return {autorun, stop, read, write}
}

/**
 * Utils
 */

function add (array, value) {
  if (!~array.indexOf(value)) array.push(value)
}

function each (value, func) {
  let i = -1
  while (++i < value.length) func(value[i], i)
}

function stop (func) {
  if (func && func[subsKey]) {
    each(func[subsKey], subs => {
      const index = subs.indexOf(func)
      if (~index) subs.splice(index, 1)
    })
    func[subsKey] = null
  }
}

function register (tree, path, func) {
  let step = tree
  each(path, key => {
    step = step[key] || (step[key] = {})
  })
  const subs = step[subsKey] || (step[subsKey] = [])
  add(subs, func)
  add(func[subsKey] || (func[subsKey] = []), subs)
}

function collectChanges (subsToNotify, subsSubtree, lastSubtree, nextSubtree) {
  if (!subsSubtree || deepEqual(lastSubtree, nextSubtree)) return

  const subs = subsSubtree[subsKey]
  if (subs) each(subs, sub => {add(subsToNotify, sub)})

  each(Object.keys(subsSubtree), key => {
    if (key === subsKey) return
    const last = lastSubtree != null ? lastSubtree[key] : undefined
    const next = nextSubtree != null ? nextSubtree[key] : undefined
    collectChanges(subsToNotify, subsSubtree[key], last, next)
  })
}
