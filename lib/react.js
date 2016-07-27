'use strict'

const {getIn, deepEqual} = require('emerge')
const {pipe, isFunction, validate} = require('fpx')
const {hasOwnProperty} = Object.prototype

/**
 * Methods
 */

const methods = {
  componentWillMount () {
    this._view = view(this)
    this._unsub = this._app.addView(this._view)
    if (this._mount) this._mount()
  },

  componentWillUnmount () {
    if (this._unmount) this._unmount()
    if (this._unsub) this._unsub()
  },

  // Prevents unnecessary renders caused by ancestor views. This works best if
  // props and state are kept to the minimum.
  shouldComponentUpdate (props, state) {
    return !deepEqual(props, this.props) || !deepEqual(state, this.state)
  },

  render () {
    const [paths, dom] = runRender(
      this._render,
      this._app.mean,
      this.props,
      this._app.enque
    )
    this._view.paths = paths
    return dom
  }
}

/**
 * Factories
 */

exports.Auto = Auto
function Auto (app, createClass) {
  return pipe(funToConfig, ReactiveClass(app, createClass))
}

exports.ReactiveClass = ReactiveClass
function ReactiveClass (app, createClass) {
  validate(isFunction, app.addView)
  validate(isFunction, app.enque)
  validate(isFunction, createClass)

  return function reactiveClass (config) {
    return createClass({
      displayName: config.render.name,
      ...config,
      ...methods,
      _app: app,
      _render: config.render,
      _mount: config.componentWillMount,
      _unmount: config.componentWillUnmount
    })
  }
}

/**
 * Utils
 */

function view (instance) {
  return {instance, paths: [], update}
}

function runRender (reader, state, props, enque) {
  const paths = []
  function read (...path) {
    paths.push(path)
    return getIn(state, path)
  }
  const value = reader(props, read, enque)
  return [paths.slice(), value]
}

function funToConfig (render) {
  validate(isFunction, render)
  return {...render, render}
}

function update () {
  if (!dead(this.instance)) this.instance.forceUpdate()
}

function dead (inst) {
  return inst._calledComponentWillUnmount ||
    hasOwnProperty.call(inst, '_reactInternalInstance') &&
    !inst._reactInternalInstance
}
