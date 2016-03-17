import 'simple-pjax'
import React from 'react'
import {renderTo} from './utils'
import './classes'

/**
 * Demonstrates reactive components as functions
 */

renderTo('[data-state]', state)
function state (props, read) {
  return (
    <pre className='pad hljs'>{JSON.stringify(read(), null, 2)}</pre>
  )
}

renderTo('[data-profile]', profile)
function profile (props, read) {
  return (
    <div>
      <p>profiles: {JSON.stringify(read('profiles'))}</p>
    </div>
  )
}
