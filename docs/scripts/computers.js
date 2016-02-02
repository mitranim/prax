import {last, isObject} from 'prax/lang'
import {compute, computeEach} from 'prax/compute'

export default [
  compute(['profileCount'], [['profiles']], size),
  computeEach(['dialogs'], [lastMessageId], dialog)
]

function size (value) {
  return isObject(value) ? value.length || Object.keys(value).length : 0
}

function lastMessageId (dialog) {
  return ['messages', last(dialog._messageIds)]
}

function dialog (key, value, message) {
  return {
    _unprocessed: message && message.sender !== value._shopId
  }
}
