'use strict'

const IDLE = 0
const DUE = 1

// Equivalent to spamming `setTimeout(effect, 0, event)`, but with a difference:
// this system flushes enqueued events synchronously, avoiding UI repaints
// between sibling events.
exports.createEventLoop = createEventLoop
function createEventLoop (effect) {
  const eventQueue = []
  let state = IDLE

  // IDLE -> DUE
  function tick () {
    if (state === IDLE) {
      state = DUE
      setTimeout(work)
    }
  }

  // DUE -> IDLE
  function work () {
    if (state === DUE) {
      try {
        flush()
      } finally {
        state = IDLE
      }
    }
  }

  // pending -> empty
  function flush () {
    if (eventQueue.length) {
      try {
        effect(eventQueue.shift())
      } finally {
        flush()
      }
    }
  }

  return function enqueue (event) {
    eventQueue.push(event)
    tick()
  }
}

// Mostly equivalent to the version above, but may give the browser a chance to
// repaint between sibling events.
exports._createEventLoop = _createEventLoop
function _createEventLoop (effect) {
  return function enqueue (event) {
    // setTimeout(effect, 0, event)
    setTimeout(call(effect, event))  // IE9
  }
}

function call (func, arg) {
  return () => { func(arg) }
}
