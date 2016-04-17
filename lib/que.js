'use strict'

/* eslint-disable block-spacing, one-var, indent */

const
INERT = 0,
IDLE = 1,
DUE = 2

// Unbounded queue with one consumer. Flushes synchronously.
exports.Que = Que
function Que () {
  const que = []
  let state = INERT
  let consume

  // IDLE -> DUE
  function tick () {
    if (state === IDLE) {
      state = DUE
      work()
    }
  }

  // DUE -> IDLE
  function work () {
    if (state === DUE) {
      try {flush()} finally {state = IDLE}
    }
  }

  // pending -> empty
  function flush () {
    if (que.length) {
      try {consume(que.shift())} finally {flush()}
    }
  }

  return {
    // INERT -> IDLE
    setConsumer (func) {
      if (state === INERT) {
        state = IDLE
        consume = func
        tick()
      }
    },
    push () {
      que.push.apply(que, arguments)
      tick()
    }
  }
}

// Similar to the version above, but flushes asynchronously, giving the browser
// a chance to repaint between sibling events.
exports._Que = _Que
function _Que () {
  let effect

  return {
    setConsumer (func) {
      effect = func
    },
    push (event) {
      setTimeout(effect.bind(null, event))
    }
  }
}
