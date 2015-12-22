'use strict'

const readAtPath = require('emerge').readAtPath

exports.toAsync = toAsync
function toAsync (atom) {
  let currentState = atom.read()
  let pending = false

  function read () {
    atom.read.apply(null, arguments)
    return readAtPath(currentState, arguments)
  }

  function write (nextState) {
    currentState = nextState
    if (pending) return

    pending = true
    timer(() => {
      pending = false
      atom.write(currentState)
    })
  }

  return {read, write, watch: atom.watch, stop: atom.stop}
}

function timer (func) {
  if (typeof requestAnimationFrame === 'function') requestAnimationFrame(func)  // eslint-disable-line
  else setTimeout(func, 16)
}
