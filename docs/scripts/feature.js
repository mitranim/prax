const {scan, putAt, patchAt, pipe, val, isObject, isList,
       onEvent, onType, compute} = require('prax')

/**
 * State
 */

exports.state = {
  keyCode: 0,
  profiles: {},
  visibility: {}
}

/**
 * Reducers
 */

exports.reducers = [
  onEvent({type: 'set', path: isList}, (state, {path, value}) => (
    putAt(path, state, value)
  )),

  onType('init', (state, {value}) => putAt([], state, value)),

  onType('keyCode', to(['keyCode'], passVal)),

  onType('show', toOne(['visibility'], val(true))),
  onType('hide', toOne(['visibility'], val(null))),
  onType('toggle', zoomOne(['visibility'], negate)),

  onType('profile', zoomOne(['profiles'], pipe(passVal, profile)))
]

/**
 * Computers
 */

exports.computers = [
  compute(['profileCount'], [['profiles']], size)
]

/**
 * Definitions
 */

function profile (fields) {
  return {
    ...fields,
    nameLength: fields.name.length
  }
}

/**
 * Utils
 */

function negate (value) {
  return !value || null
}

function size (value) {
  return isList(value)
    ? value.length
    : isObject(value)
    ? Object.keys(value).length
    : 0
}

function to (path, fun) {
  return (state, event) => putAt(path, state, fun(state, event))
}

function passVal (_state, event) {
  return scan(event, 'value')
}

function toOne (path, fun) {
  return onEvent({key: Boolean}, (state, event) => (
    patchAt([...path, event.key], state, fun(state, event))
  ))
}

function zoomOne (path, fun) {
  return toOne(path, (state, event) => (
    fun(scan(state, ...path, event.key), event)
  ))
}
