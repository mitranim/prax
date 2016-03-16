'use strict'

const deepEqual = require('emerge').deepEqual

// TODO:
//   define descriptors statically where possible
//   rename `auto` as `view`

// Takes a component class, such as React.Component, and an instance of WatchNow
// referencing a prax app. Returns a function that creates a subclass of this
// component from a vanilla JavaScript function. The resulting component is
// reactive: if the function accesses the app data, the component will
// automatically update when that data is changed. See examples in docs.
exports.Auto = Auto
function Auto (Component, watch) {
  validateFunc(Component)
  validateFunc(watch)

  return function auto (render) {
    function Auto () {
      Component.apply(this, arguments)
    }

    Auto.prototype = Object.create(Component.prototype, descriptors({
      constructor: Auto,

      componentWillUnmount () {
        if (this._unsub) this._unsub()
      },

      // Works best for minimal props and states, like object ids.
      shouldComponentUpdate (props) {
        return !deepEqual(props, this.props)
      },

      _render (read) {
        this._dom = render(this.props, read)
      },

      render () {
        if (this._unsub) this._unsub()
        this._unsub = watch(duo(this._render, update, this))
        return this._dom
      }
    }))

    if (Object.setPrototypeOf) Object.setPrototypeOf(Auto, Component)
    else for (const key in Component) Auto[key] = Component[key]

    Auto.displayName = render.name || render.displayName || 'Auto'

    return Auto
  }
}

// Creates a decorator that makes the decorated component class reactive based
// on the given watch func. If it accesses the app data in its `render` method,
// it's going to be automatically updated when the data is changed. See examples
// in docs.
exports.ReactiveRender = ReactiveRender
function ReactiveRender (watch) {
  validateFunc(watch)

  return function reactiveRender (Component) {
    const unmount = Component.prototype.componentWillUnmount
    const render = Component.prototype.render

    function Reactive () {
      Component.apply(this, arguments)
    }

    Reactive.prototype = Object.create(Component.prototype, descriptors({
      constructor: Reactive,

      componentWillUnmount () {
        if (this._unsub) this._unsub()
        if (typeof unmount === 'function') unmount.call(this)
      },

      // Prevent unnecessary renders caused by ancestor components. This works
      // best if props and state are kept to the minimum.
      shouldComponentUpdate (props, state) {
        return !deepEqual(props, this.props) || !deepEqual(state, this.state)
      },

      _render (read) {
        this._dom = render.call(this, read)
      },

      render () {
        if (this._unsub) this._unsub()
        this._unsub = watch(duo(this._render, update, this))
        return this._dom
      }
    }))

    if (Object.setPrototypeOf) Object.setPrototypeOf(Reactive, Component)
    else for (const key in Component) Reactive[key] = Component[key]

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
  if (!emptyInstance(this)) this.forceUpdate()
}

function emptyInstance (self) {
  return self.hasOwnProperty('_reactInternalInstance') && !self._reactInternalInstance
}

function descriptors (values) {
  const buffer = {}
  for (const key in values) buffer[key] = {value: values[key]}
  return buffer
}
