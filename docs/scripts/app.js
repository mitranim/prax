import 'simple-pjax'
import React from 'react'
import {renderTo} from './utils'
import './classes'

/**
 * Reactive components as functions
 */

renderTo('[data-state]', state)
function state (props, read) {
  return (
    <pre className='pad'>{JSON.stringify(read(), null, 2)}</pre>
  )
}

renderTo('[data-person]', person)
function person (props, read) {
  return (
    <div>
      <p>person: {JSON.stringify(read('persons', 1))}</p>
    </div>
  )
}

renderTo('[data-person-name-length]', personNameLength)
function personNameLength (props, read) {
  return (
    <div>
      <p>person name length: {nameLength(read, 1)}</p>
    </div>
  )
}

/**
 * Utils
 */

function nameLength (read, id) {
  const name = read('persons', id, 'name')
  return (name && name.length) | 0
}
