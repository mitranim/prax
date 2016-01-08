'use strict'

const deepEqual = require('emerge').deepEqual

// Takes a component class, such as React.Component, and an atom's watch
// function. Returns a function that creates a subclass of this component from a
// vanilla JavaScript function. The resulting component is reactive: if the
// function accesses the atom data, the component will automatically update when
// that data is changed. See examples in docs.
exports.createAuto = createAuto
function createAuto (Component, watch) {
  validateFunc(Component)
  validateFunc(watch)

  return function auto (renderFunc) {
    class Auto extends Component {
      componentWillUnmount () {
        if (this._unsub) this._unsub()
      }

      // Works best for minimal props and states, like object ids.
      shouldComponentUpdate (props) {
        return !deepEqual(props, this.props)
      }

      _render (arg) {
        this._dom = renderFunc(this.props, arg)
      }

      render () {
        if (this._unsub) this._unsub()
        this._unsub = watch(duo(this._render, update, this))
        return this._dom
      }
    }

    Auto.displayName = renderFunc.name || renderFunc.displayName || 'Auto'

    return Auto
  }
}

// Creates a decorator that makes the decorated component class reactive based
// on the given watch func. If it accesses the atom data in its `render` method,
// it's going to be automatically updated when the data is changed. See examples
// in docs.
exports.createReactiveRender = createReactiveRender
function createReactiveRender (watch) {
  validateFunc(watch)

  return function reactiveRender (Component) {
    class Reactive extends Component {
      componentWillUnmount () {
        if (this._unsub) this._unsub()
        if (typeof super.componentWillUnmount === 'function') {
          super.componentWillUnmount()
        }
      }

      // Prevent unnecessary renders caused by ancestor components. This works
      // best if props and state are kept to the minimum.
      shouldComponentUpdate (props, state) {
        return !deepEqual(props, this.props) || !deepEqual(state, this.state)
      }

      _render (arg) {
        this._dom = super.render(arg)
      }

      render () {
        if (this._unsub) this._unsub()
        this._unsub = watch(duo(this._render, update, this))
        return this._dom
      }
    }

    Reactive.displayName = Component.name || Component.displayName || 'Reactive'

    return Reactive
  }
}

/**
 * Utils
 */

function duo (first, second, thisArg) {
  let i = 0
  return arg => {
    i++
    if (i === 1) first.call(thisArg, arg)
    else if (i === 2) second.call(thisArg)
  }
}

function validateFunc (value) {
  if (typeof value !== 'function') throw Error(`Expected a function, got: ${value}`)
}

function update () {
  if (this.hasOwnProperty('_reactInternalInstance') && !this._reactInternalInstance) {
    return
  }
  this.forceUpdate()
}
