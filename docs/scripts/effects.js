import {id} from 'prax/lang'
import {std} from 'prax/reduce'
import {where} from 'prax/effects'

export default [
  where(
    [['updating', 'profile']],
    id,
    value => std('profile/update/done', value.id, value)
  )
]
