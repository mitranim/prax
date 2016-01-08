import React from 'react'
import {renderTo} from './utils'
import {reactiveRender} from './core'

// Demonstrates reactive `render`. These components are automatically updated
// when the atom data is changed.

renderTo('[data-key]')(reactiveRender(
class KeyReporter extends React.Component {
  render (read) {
    return (
      <div>
        <p>last pressed key's code: {read('key')}</p>
      </div>
    )
  }
}))

renderTo('[data-stamp]')(reactiveRender(
class StampReporter extends React.Component {
  render (read) {
    return (
      <div>
        <p>ms elapsed since page load: {read('stamp')}</p>
      </div>
    )
  }
}))
