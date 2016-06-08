const {isObject, id, val, on, one, manage, upgrade, pass, stk,
       compute, where} = require('prax')

/**
 * State
 */

exports.state = {
  keyCode: 0,
  profiles: {},
  visibility: {},
  updating: {}
}

/**
 * Reducers
 */

exports.reducers = [
  manage(['keyCode'],
    on('keyCode', pass)
  ),

  manage(['visibility'],
    one('show', val(true)),
    one('hide', val(false)),
    one('toggle', negate)
  ),

  manage(['profiles'],
    one('profile', upgrade(profile)),
    one('profile/update/done', upgrade(profile))
  ),

  manage(['updating', 'profile'],
    on('profile/update', pass),
    on('profile/update/done', val(null))
  )
]

/**
 * Computers
 */

exports.computers = [
  compute(['profileCount'], [['profiles']], size)
]

/**
 * Effects
 */

exports.effects = [
  where(
    [['updating', 'profile']],
    id,
    value => stk('profile/update/done', value.id, value)
  )
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
  return !value
}

function size (value) {
  return isObject(value) ? value.length || Object.keys(value).length : 0
}
