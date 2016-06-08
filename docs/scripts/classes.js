const React = require('react')
const {reactiveRender} = require('./core')

// Demonstrates reactive `render`. This view stays in sync with the app
// data accessed in its `render` method. (This also works with ES6-style
// classes.)

export const KeyCode = reactiveRender(React.createClass({
  render (read) {
    return (
      <div>
        <p>last pressed key's code: {read('keyCode')}</p>
      </div>
    )
  }
}))
