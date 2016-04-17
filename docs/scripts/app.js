import React from 'react'
import {renderTo, setup, teardown} from './utils'
import {KeyCode} from './classes'
import {auto} from './core'

/**
 * Reactive views as pure functions
 */

renderTo('[data-state]', auto(state))
function state (props, read) {
  return (
    <pre className='pad hljs'>{JSON.stringify(read(), null, 2)}</pre>
  )
}

renderTo('[data-profile]', auto(profile))
function profile (props, read) {
  return (
    <div>
      <p>profiles: {JSON.stringify(read('profiles'))}</p>
    </div>
  )
}

renderTo('[data-key-code]', KeyCode)

/**
 * Setup/Teardown
 */

setup()

if (module.hot) {
  module.hot.accept(err => {
    console.error('Exception during HMR update, page refresh required.', err)
  })
  module.hot.dispose(teardown)
}
