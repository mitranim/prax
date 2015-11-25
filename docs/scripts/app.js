// import 'stylific'
import React from 'react'
import {renderTo} from './utils'
import {read} from './core'
import './legacy'

/**
 * Reactive components as pure functions
 */

renderTo('[data-state]', state)
function state (props) {
  return (
    <pre className='pad'>{JSON.stringify(read(), null, 2)}</pre>
  )
}

renderTo('[data-person]', person)
function person (props) {
  return (
    <div>
      <p>person: {JSON.stringify(read('persons', 1))}</p>
    </div>
  )
}

/**
 * Computed data is automatically reactive
 */

renderTo('[data-person-name-length]', personNameLength)
function personNameLength (props) {
  return (
    <div>
      <p>person name length: {nameLength(1)}</p>
    </div>
  )
}

/**
 * Reactive computed data
 */

function nameLength (id) {
  const name = read('persons', id, 'name')
  return (name && name.length) | 0
}
