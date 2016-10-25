const {patchIn, foldl, isObject, isFunction, validate} = require('prax')

export function onload (document, fun) {
  validate(isFunction, fun)
  if (/loaded|complete|interactive/.test(document.readyState)) {
    setTimeout(fun)
  } else {
    document.addEventListener('DOMContentLoaded', function cb () {
      document.removeEventListener('DOMContentLoaded', cb)
      fun()
    })
  }
}

export function merge () {
  return foldl(mergeTwo, undefined, arguments)
}

function mergeTwo (acc, value) {
  return patchIn(acc, [], (isObject(value) ? value : {}))
}

export function addEvent (target, name, fun, useCapture = false) {
  validate(isFunction, fun)
  target.addEventListener(name, fun, useCapture)
  return () => {
    target.removeEventListener(name, fun, useCapture)
  }
}

/**
 * Dev
 */

window.dev = {...window.dev, merge}

if (window.devMode) Object.assign(window, window.dev)
