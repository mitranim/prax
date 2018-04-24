const {TaskQue} = require('espo')
const f = require('fpx')

export function addEvent (target, name, fun, useCapture = false) {
  f.validate(fun, f.isFunction)
  target.addEventListener(name, fun, useCapture)
  return function removeEvent () {
    target.removeEventListener(name, fun, useCapture)
  }
}

export function jsonEncode (value) {
  try {return JSON.stringify(value)}
  catch (_) {return 'null'}
}

export function jsonDecode (value) {
  try {return JSON.parse(value)}
  catch (_) {return null}
}

export function htmlProps (html) {
  return {dangerouslySetInnerHTML: {__html: html}}
}

export function toInt32 (value) {
  return value | 0  // eslint-disable-line
}

// Pixel measurements are inaccurate when the browser is zoomed in or out, so we
// have to use a small non-zero value in some geometry checks.
const PX_ERROR_MARGIN = 3

export function smoothScrollY ({velocity, getDeltaY}) {
  f.validate(velocity, f.isFinite)
  f.validate(getDeltaY, f.isFunction)

  // Used to track deltaY changes between frames.
  let lastDeltaY = null

  return doEachFrameWhile(function smoothScrollStep () {
    const deltaY = getDeltaY()

    if (
      !f.isFinite(deltaY) ||
      // Couldn't move, must have reached the end.
      (f.isFinite(lastDeltaY) && Math.abs(lastDeltaY - deltaY) <= PX_ERROR_MARGIN) ||
      // Close enough.
      Math.abs(deltaY) <= PX_ERROR_MARGIN
    ) {
      return false
    }

    lastDeltaY = deltaY

    window.scrollBy(0, limitTo(velocity, deltaY))

    return true
  })
}

export function smoothScrollYTo ({velocity, selector}) {
  return smoothScrollY({
    velocity,
    getDeltaY () {
      const elem = document.querySelector(selector)
      return !elem ? null : elem.getBoundingClientRect().top - toInt32(getHeaderHeight())
    },
  })
}

export function smoothScrollYWithin ({milliseconds, minVelocity, getDeltaY}) {
  const deltaY = getDeltaY()

  if (!f.isFinite(deltaY)) return f.noop

  // This is so stupid. How much web animation code is going to break when
  // refresh rates change? And there's no API to get the actual refresh rate!
  const refreshRate = 60

  const msPerFrame = 1000 / refreshRate

  const velocity = Math.abs(deltaY / (milliseconds / msPerFrame))

  return smoothScrollY({velocity: Math.max(minVelocity || 10, velocity), getDeltaY})
}

export function smoothScrollYToWithin ({milliseconds, minVelocity, selector}) {
  return smoothScrollYWithin({
    milliseconds,
    minVelocity,
    getDeltaY () {
      const elem = document.querySelector(selector)
      return !elem ? null : elem.getBoundingClientRect().top - toInt32(getHeaderHeight())
    },
  })
}

export function smoothScrollToTop ({milliseconds}) {
  return smoothScrollYWithin({milliseconds, getDeltaY: getDocumentTopDelta})
}

export function getHeaderHeight () {
  const header = document.getElementById('header')
  return !header
    ? null
    // Adds a few extra pixels for the shadow
    : header.getBoundingClientRect().height + 6
}

function getDocumentTopDelta () {
  return document.documentElement.getBoundingClientRect().top
}

// `limit` must be positive.
// ---|-----|-----0-----|-----|---
//   num  limit       limit  num
function limitTo (limit, num) {
  return num > 0
    ? Math.min(limit, num)
    : Math.max(-limit, num)
}

export function doEachFrameWhile (fun) {
  let i = 0
  return onFrame(function onFrameWhile (scheduleNext) {
    i += 1
    if (i === 300) {
      throw Error(`Task has been running for 300 frames, aborting: ${fun}`)
    }
    if (fun()) scheduleNext()
  })
}

export function onFrame (fun) {
  let timerId = requestAnimationFrame(function run () {
    timerId = null
    let enabled = true
    // Next frame can be scheduled only synchronously and only once.
    function scheduleNext () {
      if (!enabled) return
      enabled = false
      timerId = requestAnimationFrame(run)
    }
    try {
      fun(scheduleNext)
    }
    finally {
      enabled = false
    }
  })

  return function abort () {
    cancelAnimationFrame(timerId)
  }
}

// WTB better name
export class CleanupQue extends TaskQue {
  constructor () {
    super()
    this.dam()
  }

  flush () {
    if (this.state !== this.state.FLUSHING) {
      try {super.flush()}
      finally {this.dam()}
    }
  }

  deinit () {
    this.flush()
  }
}
