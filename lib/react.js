'use strict'

/* eslint-disable block-spacing */

const {deepEqual} = require('emerge')

const {slice, validate, mapValues, isFunction} = require('./lang')

/**
 * Methods
 */

const methods = {
  componentWillUnmount () {
    if (this._unsub) this._unsub()
    if (this._unmount) this._unmount()
  },

  // Prevents unnecessary renders caused by ancestor views. This works best if
  // props and state are kept to the minimum.
  shouldComponentUpdate (props, state) {
    return !deepEqual(props, this.props) || !deepEqual(state, this.state)
  },

  _update (read) {
    this._dom = this._render(this.props, read)
  },

  render () {
    if (this._unsub) this._unsub()
    this._unsub = this._watch(duo(this._update, update, this))
    return this._dom
  }
}

function reactiveRenderUpdate (read) {
  this._dom = this._render(read)
}

/**
 * Factories
 */

// Creates a function that takes a pure render function and returns a reactive
// view. See examples in docs.
exports.Auto = Auto
function Auto (View, watch) {
  validate(isFunction, View)
  validate(isFunction, watch)

  return function auto (render) {
    function Auto () {View.apply(this, arguments)}

    Auto.prototype = derive(View.prototype, methods, {
      constructor: Auto,
      _watch: watch,
      _unmount: View.prototype.componentWillUnmount,
      _render: render
    })

    Auto.displayName = render.displayName || render.name || 'Auto'

    return Auto
  }
}

// Creates a function that subsclasses a view, making it reactive. See examples
// in docs.
exports.ReactiveRender = ReactiveRender
function ReactiveRender (watch) {
  validate(isFunction, watch)

  return function reactiveRender (View) {
    function Reactive () {View.apply(this, arguments)}

    Reactive.prototype = derive(View.prototype, methods, {
      constructor: Reactive,
      _update: reactiveRenderUpdate,
      _watch: watch,
      _unmount: View.prototype.componentWillUnmount,
      _render: View.prototype.render
    })

    Reactive.displayName = View.displayName || View.name || 'Reactive'

    return Reactive
  }
}

/**
 * Utils
 */

function duo (first, second, thisArg) {
  let i = 0
  return arg => {
    i += 1
    if (i === 1) first.call(thisArg, arg)
    else if (i === 2) second.call(thisArg)
  }
}

function update () {
  if (!emptyInstance(this)) this.forceUpdate()
}

function emptyInstance (self) {
  return self.hasOwnProperty('_reactInternalInstance') && !self._reactInternalInstance
}

function derive (proto) {
  return Object.create(proto, descriptors(concat(slice(arguments, 1))))
}

function descriptors (values) {
  return mapValues(descriptor, values)
}

function descriptor (value) {
  return {value, writable: true, enumerable: false, configurable: true}
}

function concat (objects) {
  return objects.reduce(extend, {})
}

function extend (left, right) {
  for (const key in right) left[key] = right[key]
  return left
}
