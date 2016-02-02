import {readAtPath} from 'prax/emerge'
import {is} from 'prax/lang'
import {std} from 'prax/reduce'
import {emit, subscribe} from './core'

subscribe(when(
  valueAt('updating', 'profile'),
  emit(value => std('profile/update/done', value.id, value))
))

function when (predicate, effect) {
  return function (prev, next) {
    const value = predicate(next)
    if (value && !is(predicate(prev), value)) effect(value)
  }
}

function valueAt () {
  return value => readAtPath(value, arguments)
}
