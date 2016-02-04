import {isObject} from 'prax/lang'
import {compute} from 'prax/compute'

export default [
  compute(['profileCount'], [profiles], size)
]

function size (value) {
  return isObject(value) ? value.length || Object.keys(value).length : 0
}

function profiles () {
  return ['profiles']
}
