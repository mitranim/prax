import {pipe, mapValues} from 'prax/lang'
import {on, one, manage, upgrade, passNext, mapAndGroup, mapTo} from 'prax/reduce'

export default [
  manage(['keyCode'],
    on('keyCode', passNext)
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
    on('profile/update', passNext),
    on('profile/update/done', () => null)
  ),

  manage(['dialogs'],
    on('dialogs', mapAndGroup(dialog, 'subject')),
    one('dialog', upgrade(dialog)),
    on('messages', pipe(passNext, mapTo(message), idsBySubject))
  ),

  manage(['messages'],
    on('messages', mapAndGroup(message, '_id')),
    one('message', upgrade(message))
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

function dialog (fields) {
  return {
    _messageIds: [],
    ...fields,
    _unread: fields.last_message_read < fields.last_message
  }
}

function message (fields) {
  return {
    ...fields,
    _id: msgId(fields)
  }
}

function msgId ({sender, receiver, created}) {
  return hash(`${sender} -> ${receiver} @ ${created}`)
}

function idsBySubject (messages) {
  return mapValues(groupBy(messages, 'subject'), toIds)
}

function toIds (messages) {
  return {_messageIds: messages.map(getId)}
}

function getId (value) {
  return value._id
}

/**
 * Utils
 */

function negate (value) {
  return !value
}

function hash (str) {
  let hash = 5381
  let i = str.length
  while (i) hash = (hash * 33) ^ str.charCodeAt(--i)
  return String(hash >>> 0)
}

function groupBy (list, key) {
  const buffer = {}
  for (let i = -1; ++i < list.length;) {
    const item = list[i]
    const group = buffer[item[key]] || (buffer[item[key]] = [])
    group.push(item)
  }
  return buffer
}
