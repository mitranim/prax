'use strict'

const readAtPath = require('emerge').readAtPath
const deepEqual = require('emerge').deepEqual
const slice = Array.prototype.slice

exports.createPrax = createPrax
function createPrax (lastState) {
  const subscribersByPaths = {}
  let subscriberPaths

  function autorun (func) {
    if (typeof func !== 'function') {
      throw Error(`Expected a function, got: ${func}`)
    }

    const lastPaths = subscriberPaths
    subscriberPaths = []

    try {
      func()
      subscriberPaths.forEach(pt => {
        const funcs = subscribersByPaths[pt] || (subscribersByPaths[pt] = [])
        add(funcs, func)
      })
    } finally {
      subscriberPaths = lastPaths
    }

    return func
  }

  function stop (func) {
    if (typeof func !== 'function') return
    Object.keys(subscribersByPaths).forEach(key => {
      const funcs = subscribersByPaths[key]
      const index = funcs.indexOf(func)
      if (~index) funcs.splice(index, 1)
    })
  }

  function read () {
    const path = slice.call(arguments)
    if (subscriberPaths) add(subscriberPaths, path.join('.'))
    return readAtPath(lastState, path)
  }

  function write (nextState) {
    const pts = changedPaths(lastState, nextState, Object.keys(subscribersByPaths))
    lastState = nextState
    const funcsToNotify = []

    pts.forEach(pt => {
      const funcs = subscribersByPaths[pt]
      if (!funcs) return
      if (!funcs.length) {
        delete subscribersByPaths[pt]
        return
      }
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
