import React from 'react'
import {renderTo} from './utils'
import {atom, read} from './core'
import {createReactiveRender, createReactiveMethod} from 'prax/react'

/**
 * Decorators for legacy components.
 */

const reactiveRender = createReactiveRender(atom)
const reactiveMethod = createReactiveMethod(atom)

// Reactive `render`. The component is automatically updated when the atom data
// is changed.
@renderTo('[data-key]')
@reactiveRender
export class KeyReporter extends React.Component {
  render () {
    return (
      <div>
        <p>last pressed key's code: {read('key')}</p>
      </div>
    )
  }
}

// Reactive updates with `setState`. The method is automatically rerun when the
// atom data is changed.
@renderTo('[data-stamp]')
export class StampReporter extends React.Component {
  @reactiveMethod
  update () {
    this.setState({
      stamp: read('stamp')
    })
  }

  render () {
    return (
      <div>
        <p>ms elapsed since page load: {this.state.stamp}</p>
      </div>
    )
  }
}
