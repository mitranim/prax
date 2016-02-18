import React from 'react'
import {renderTo} from './utils'
import {reactiveRender} from './core'

// Demonstrates reactive `render`. This component stays in sync with the app
// data accessed in its `render` method. (This also works with ES6-style
// classes.)

renderTo('[data-key-code]')(reactiveRender(React.createClass({
  render (read) {
    return (
      <div>
        <p>last pressed key's code: {read('keyCode')}</p>
      </div>
    )
  }
})))
