'use strict'

const readAtPath = require('emerge').readAtPath
const deepEqual = require('emerge').deepEqual
const slice = Array.prototype.slice

exports.createPrax = createPrax
function createPrax (lastState) {
  const subsTree = {}
  let pathsToSubscribe

  function autorun (func) {
    if (typeof func !== 'function') {
      throw Error(`Expected a function, got: ${func}`)
    }

    const last = pathsToSubscribe
    pathsToSubscribe = []

    try {
      func()
      pathsToSubscribe.forEach(pt => {
        const funcs = subsTree[pt] || (subsTree[pt] = [])
        add(funcs, func)
      })
    } finally {
      pathsToSubscribe = last
    }

    return func
  }

  function stop (func) {
    if (typeof func !== 'function') return
    Object.keys(subsTree).forEach(key => {
      const subs = subsTree[key]
      const index = subs.indexOf(func)
      if (~index) subs.splice(index, 1)
    })
  }

  function read () {
    const path = slice.call(arguments)
    if (pathsToSubscribe) add(pathsToSubscribe, path.join('.'))
    return readAtPath(lastState, path)
  }

  function write (nextState) {
    const pts = changedPaths(lastState, nextState, Object.keys(subsTree))
    lastState = nextState
    const subs = []

    pts.forEach(pt => {
      const funcs = subsTree[pt]
      if (!funcs) return
      if (!funcs.length) {
        delete subsTree[pt]
        return
      }
      funcs.forEach(func => {add(subs, func)})
    })

    subs.forEach(autorun)
  }

  return {autorun, stop, read, write}
}

/**
 * Utils
 */

function add (array, value) {
  if (!~array.indexOf(value)) array.push(value)
}

function changedPaths (prev, next, pts) {
  return pts.filter(pt => {
    const path = pt ? pt.split('.') : []
    return !deepEqual(readAtPath(prev, path), readAtPath(next, path))
  })
}
