const {scan, putAt, id: exists, isList, onEvent, onType, compute} = require('prax')

/**
 * State
 */

exports.state = {
  keyCode: 0,
  profiles: {}
}

/**
 * Reducers
 */

exports.reducers = [
  // For REPL
  onEvent({type: 'set', path: isList}, (state, {path, value}) => (
    putAt(path, state, value)
  )),

  onType('init', putTo([], eventValue)),

  onType('keyCode', putTo(['keyCode'], eventValue)),

  onEvent({type: 'profile', value: {id: exists}}, setProfile)
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

function setProfile (state, {value: profile}) {
  return putAt(['profiles', profile.id], state, {
    ...profile,
    nameLength: profile.name.length
  })
}

/**
 * Utils
 */

function size (value) {
  return isList(value) ? value.length : Object.keys(Object(value)).length
}

function putTo (path, fun) {
  return (state, event) => putAt(path, state, fun(state, event))
}

function eventValue (_state, event) {
  return scan(event, 'value')
}
