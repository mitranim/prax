'use strict'

const bind = require('./lang').bind

const IDLE = 0
const DUE = 1

// Similar to perusing the JavaScript event loop with
// `setTimeout(effect, 0, event)`, but with a significant advantage: this loop
// flushes enqueued events synchronously, avoiding unnecessary UI repaints.
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

// Mostly equivalent to the version above, but gives the browser a chance to
// repaint between sibling events.
exports._createEventLoop = _createEventLoop
function _createEventLoop (effect) {
  return function enqueue (event) {
    setTimeout(bind(effect, event))
  }
}
