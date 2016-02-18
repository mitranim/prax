'use strict'

/* eslint-disable block-spacing */

const IDLE = 0
const DUE = 1

// Similar to perusing the JavaScript event loop with
// `setTimeout(effect, 0, event)`, but with a significant advantage: this queue
// flushes enqueued events synchronously, avoiding unnecessary UI repaints. When
// idle, the first invocation is deferred. For `defer`, use `setTimeout` in
// browser, `process.nextTick` or `setImmediate` in Node.
exports.Enque = Enque
function Enque (effect, defer) {
  const eventQue = []
  let state = IDLE

  // IDLE -> DUE
  function tick () {
    if (state === IDLE) {
      state = DUE
      defer(work)
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
    if (eventQue.length) {
      try {effect(eventQue.shift())} finally {flush()}
    }
  }

  return function enque (event) {
    eventQue.push(event)
    tick()
  }
}

// Mostly equivalent to the version above, but gives the browser a chance to
// repaint between sibling events when used with `setTimeout`.
exports._Enque = _Enque
function _Enque (effect, defer) {
  return function enque (event) {
    defer(effect.bind(null, event))
  }
}
