'use strict'

const {deepEqual} = require('emerge')
const {pipe, isFunction, validate} = require('fpx')
const {Watcher} = require('./words')

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

  render () {
    if (this._unsub) this._unsub()
    this._unsub = this._watch(duo(this._update, update, this))
    return this._dom
  },

  _update (a, b, c) {
    this._dom = this._render(this.props, a, b, c)
  }
}

/**
 * Factories
 */

exports.Auto = Auto
function Auto (watch, createClass) {
  return pipe(toConfig, ReactiveClass(watch, createClass))
}

function toConfig (render) {
  validate(isFunction, render)
  return {render}
}

exports.ReactiveClass = ReactiveClass
function ReactiveClass (watch, createClass) {
  validate(isFunction, watch)
  validate(isFunction, createClass)

  return function reactiveClass (config) {
    return createClass({
      ...config,
      ...methods,
      _watch: watch,
      _render: config.render,
      _unmount: config.componentWillUnmount
    })
  }
}

// Usage:
//   const watchNow = WatchNow(app)
//   const auto = Auto(watchNow, createClass)
exports.WatchNow = WatchNow
function WatchNow (app) {
  validate(isFunction, app.addEffect)
  validate(isFunction, app.que.enque)

  return function watchNow (reader) {
    const watcher = Watcher(reader)
    watcher(app.prev, app.mean, undefined, app.que.enque)
    return app.addEffect(watcher)
  }
}

/**
 * Utils
 */

function duo (first, second, thisArg) {
  let i = 0
  return (a, b, c) => {
    i += 1
    if (i === 1) first.call(thisArg, a, b, c)
    else if (i === 2) second.call(thisArg)
  }
}

function update () {
  if (!emptyInstance(this)) this.forceUpdate()
}

function emptyInstance (self) {
  return self.hasOwnProperty('_reactInternalInstance') && !self._reactInternalInstance
}
