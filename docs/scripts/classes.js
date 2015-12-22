import React from 'react'
import {renderTo} from './utils'
import {atom, read, match} from './core'
import {createReactiveRender, createReactiveMethod, createMatchDecorator} from 'prax/react'

/**
 * Decorators for class-style components.
 */

const reactiveRender = createReactiveRender(atom)
const reactiveMethod = createReactiveMethod(atom)
const on = createMatchDecorator(match)

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

// Reactive updates with `setState`, event handling with a match decorator.
@renderTo('[data-stamp]')
export class StampReporter extends React.Component {
  // The method is automatically rerun when the data it `read`s is changed.
  @reactiveMethod
  update () {
    this.setState({
      stamp: read('stamp')
    })
  }

  @on(x => typeof x === 'number')
  test (num) {
    console.log('-- num:', num)
  }

  render () {
    return (
      <div>
        <p>ms elapsed since page load: {this.state.stamp}</p>
      </div>
    )
  }
}
