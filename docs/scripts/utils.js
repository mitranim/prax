const {isFunction, validate} = require('prax')

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

/**
 * REPL
 */

window.app = {...window.app, utils: exports}
