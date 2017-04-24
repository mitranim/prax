const {mergeBy, ifelse, id, val, bind, foldl,
  isFunction, isString, isNatural, isFinite, validate} = require('prax')

export function addEvent (target, name, fun, useCapture = false) {
  validate(isFunction, fun)
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

// Similar to `merge`, but has a special merge tactic for `className`.
export const mix = bind(foldl, bind(mergeBy, mergeClassName), {})

function mergeClassName (left, right, key) {
  return key === 'className'
    ? `${onlyString(left)} ${onlyString(right)}`.trim()
    : undefined
}

export const onlyString = ifelse(isString, id, val(''))

export function htmlProps (html) {
  return {dangerouslySetInnerHTML: {__html: html}}
}

// Pixel measurements are inaccurate when the browser is zoomed in or out, so we
// have to use a small non-zero value in some geometry checks.
const PX_ERROR_MARGIN = 3

export function smoothScrollY (velocity, getDeltaY) {
  validate(isNatural, velocity)
  validate(isFunction, getDeltaY)

  // Used to track deltaY changes between frames.
  let lastDeltaY

  return doEachFrameWhile(function smoothScrollStep () {
    const deltaY = getDeltaY()

    if (
      !isFinite(deltaY) ||
      // Couldn't move, must have reached the end.
      isFinite(lastDeltaY) && Math.abs(lastDeltaY - deltaY) <= PX_ERROR_MARGIN ||
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

function getHeaderHeight () {
  const header = document.getElementById('header')
  return !header
    ? null
    // Adds a few extra pixels for the shadow
    : header.getBoundingClientRect().height + 6
}

export function smoothScrollYToSelector (velocity, selector) {
  return smoothScrollY(velocity, () => {
    const elem = document.querySelector(selector)
    return !elem ? null : elem.getBoundingClientRect().top - (getHeaderHeight() | 0)
  })
}

export function smoothScrollToTop (velocity) {
  return smoothScrollY(velocity, getDocumentTop)
}

function getDocumentTop () {
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
  let id

  id = requestAnimationFrame(function run () {
    if (++i === 300) {
      throw Error('Task has been running for 300 frames, aborting: ' + fun)
    }
    if (fun()) id = requestAnimationFrame(run)
  })

  return function abort () {
    cancelAnimationFrame(id)
  }
}
