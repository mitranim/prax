import 'simple-pjax'
import React from 'react'
import {mount, unmount, domEvent, onload} from './utils'
import {KeyCode} from './classes'
import {auto} from './core'

const views = {
  '[data-state]': auto(stateView),
  '[data-profile]': auto(profileView),
  '[data-key-code]': KeyCode
}

/**
 * Reactive views as pure functions
 */

function stateView (props, read) {
  return (
    <pre className='pad hljs'>{JSON.stringify(read(), null, 2)}</pre>
  )
}

function profileView (props, read) {
  return (
    <div>
      <p>profiles: {JSON.stringify(read('profiles'))}</p>
    </div>
  )
}

/**
 * Setup/Teardown
 */

const nodes = []

function setup () {
  for (const selector in views) mount(selector, views[selector], nodes)
}

function teardown () {
  unmount(nodes)
}

domEvent(module, document, 'simple-pjax-after-transition', setup)
domEvent(module, document, 'simple-pjax-before-transition', teardown)

onload(setup)

/**
 * Dev
 */

if (module.hot) {
  module.hot.accept(err => {
    console.error('Exception during HMR update, page refresh required.', err)
  })
  module.hot.dispose(teardown)
}
