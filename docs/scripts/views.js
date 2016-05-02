import React from 'react'
import {auto} from './core'

/**
 * Reactive views as pure functions
 */

export const State = auto(stateView)

function stateView (props, read) {
  return (
    <pre className='pad hljs'>{JSON.stringify(read(), null, 2)}</pre>
  )
}

export const Profile = auto(profileView)

function profileView (props, read) {
  return (
    <div>
      <p>profiles: {JSON.stringify(read('profiles'))}</p>
    </div>
  )
}
