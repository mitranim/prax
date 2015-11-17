'use strict'

const readAtPath = require('emerge').readAtPath
const deepEqual = require('emerge').deepEqual
const join = Array.prototype.join

exports.createPrax = createPrax
function createPrax (lastState) {
  const funcsByPaths = {}
  let currentPaths

  function autorun (func) {
    if (typeof func !== 'function') {
      throw Error(`Expected a function, got: ${func}`)
    }

    const lastPaths = currentPaths
    currentPaths = []

    try {
      func()
      currentPaths.forEach(pt => {
        const funcs = funcsByPaths[pt] || (funcsByPaths[pt] = [])
        add(funcs, func)
      })
    } finally {
      currentPaths = lastPaths
    }

    return func
  }

  function stop (func) {
    Object.keys(funcsByPaths).forEach(key => {
      const funcs = funcsByPaths[key]
      const index = funcs.indexOf(func)
      if (~index) funcs.splice(index, 1)
    })
  }

  function read () {
    if (currentPaths) add(currentPaths, join.call(arguments, '.'))
    return readAtPath(lastState, arguments)
  }

  function write (nextState) {
    const pts = changedPaths(lastState, nextState, Object.keys(funcsByPaths))
    lastState = nextState
    const funcsToNotify = []

    pts.forEach(pt => {
      const funcs = funcsByPaths[pt]
      if (!funcs) return
      if (!funcs.length) return delete funcsByPaths[pt]
      funcs.forEach(func => {add(funcsToNotify, func)})
    })

    funcsToNotify.forEach(autorun)
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
    if (!pt) return !deepEqual(prev, next)
    const path = pt.split('.')
    return !deepEqual(readAtPath(prev, path), readAtPath(next, path))
  })
}
