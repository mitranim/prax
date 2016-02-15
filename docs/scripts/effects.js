import {std} from 'prax/reduce'
import {apply} from 'prax/lang'
import {emit, when} from './core'

when(
  at('updating', 'profile'),
  emit(value => std('profile/update/done', value.id, value))
)

function at () {
  return read => apply(read, arguments)
}
