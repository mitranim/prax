import {on, one, manage, upgrade, pass} from 'prax/reduce'

export default [
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
