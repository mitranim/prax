import {isObject} from 'prax/lang'
import {compute} from 'prax/compute'
import {it} from 'prax/lang'
import {std} from 'prax/reduce'
import {where} from 'prax/effects'
import {on, one, manage, upgrade, pass} from 'prax/reduce'

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
    one('show', () => true),
    one('hide', () => false),
    one('toggle', negate)
  ),

  manage(['profiles'],
    one('profile', upgrade(profile)),
    one('profile/update/done', upgrade(profile))
  ),

  manage(['updating', 'profile'],
    on('profile/update', pass),
    on('profile/update/done', () => null)
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
    it,
    value => std('profile/update/done', value.id, value)
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
