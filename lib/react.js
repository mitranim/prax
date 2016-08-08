'use strict'

const React = require('react')
const ReactElement = require('react/lib/ReactElement')
const {getIn, equal} = require('emerge')
const {pipe, isFunction, isPlainObject, validate} = require('fpx')
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
    return !equal(props, this.props) || !equal(state, this.state)
  },

  render () {
    const [paths, dom] = runRender.call(this)
    this._view.paths = paths
    return dom
  }
}

/**
 * Factories
 */

// TODO better name
exports.Auto = Auto
function Auto (app, createClass) {
  return pipe(funToConfig, ReactiveClass(app, createClass))
}

// TODO better name
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

exports.hackCreateElement = hackCreateElement
function hackCreateElement (updateType) {
  validate(isFunction, updateType)

  // Original 'createElement' that we're going to wrap.
  const _createElement = (
    React._createElement ||
    (React._createElement = ReactElement.createElement)
  )

  // Wrapper around 'React.createElement' that understands our views.
  function createElement () {
    arguments[0] = updateType(...arguments)
    return _createElement(...arguments)
  }

  React.createElement = ReactElement.createElement = createElement

  return createElement
}

// TODO better name
exports.ToClass = ToClass
function ToClass (createClass) {
  validate(isFunction, createClass)

  function funToClass (render) {
    return createClass({...render, render})
  }

  return function ToClass (type) {
    return isFunction(type) && !type.prototype.render
      ? type.prototype.class || (type.prototype.class = funToClass(type))
      : isPlainObject(type)
      ? type.class || (type.class = createClass(type))
      : type
  }
}

/**
 * Utils
 */

function view (instance) {
  return {instance, paths: [], update}
}

function runRender () {
  const state = this._app.mean
  const send = this._app.enque
  // TODO change view signature to (props, context)
  // const context = {...this.context, read, send}
  const paths = []

  function read (...path) {
    paths.push(path)
    return getIn(state, path)
  }

  const value = this._render(this.props, read, send)
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
