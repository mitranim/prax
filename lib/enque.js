'use strict'

/* eslint-disable block-spacing */

const IDLE = 0
const DUE = 1

// Similar to perusing the JavaScript event loop with
// `setTimeout(effect, 0, event)`, but with a significant advantage: this queue
// flushes enqueued events synchronously, avoiding unnecessary UI repaints.
// By default, the queue is flushed immediately. For deferred flush, pass
// `setTimeout` or an alternative.
exports.Enque = Enque
function Enque (effect, defer) {
  if (!defer) defer = immediate

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

// Similar to the version above, but always defers the flush, and flushes events
// asynchronously, giving the browser a chance to repaint between sibling
// events.
exports._Enque = _Enque
function _Enque (effect) {
  return function enque (event) {
    setTimeout(effect.bind(null, event))
  }
}

function immediate (func) {
  return func()
}
