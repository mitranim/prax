import {id} from 'prax/lang'
import {std} from 'prax/reduce'
import {when} from 'prax/effects'

export default [
  when(
    [['updating', 'profile']],
    id,
    value => std('profile/update/done', value.id, value)
  )
]
