'use strict'

const ReactElement = require('react/lib/ReactElement')
const {equal} = require('emerge')
const {bind, scan, adjoin, remove, not,
       isFunction, isObject, isDict, validate} = require('fpx')
const {cursorsChanged, logCalls} = require('./words')
const {hasOwnProperty} = Object.prototype

/**
 * Methods
 */

const methods = {
  // Prevents unnecessary renders caused by ancestor views. This works best if
  // props and state are kept to the minimum.
  shouldComponentUpdate (props, state) {
    return !equal(props, this.props) || !equal(state, this.state)
  },

  componentWillMount () {
    this.env.views = adjoin(this.env.views, this)
    if (this._originalWillMount) this._originalWillMount(...arguments)
  },

  componentDidMount () {
    const context = ensureContext(this.env)
    context.rendered = adjoin(context.rendered, this)
    if (this._originalDidMount) this._originalDidMount(...arguments)
  },

  componentDidUpdate () {
    const context = ensureContext(this.env)
    context.rendered = adjoin(context.rendered, this)
    if (this._originalDidUpdate) this._originalDidUpdate(...arguments)
  },

  componentWillUnmount () {
    const context = ensureContext(this.env)
    context.removed = adjoin(context.removed, this)
    context.rendered = remove(context.rendered, this)
    this.env.views = remove(this.env.views, this)
    if (this._originalWillUnmount) this._originalWillUnmount(...arguments)
  },

  render () {
    const [dom, paths] = logCalls.call(this, bind(scan, this.env.state), runRender)
    this._paths = paths
    return dom
  }
}

function runRender (read) {
  return this._originalRender(this.props, {
    ...this.context,
    ...this._additionalContext,
    read,
    env: this.env
  })
}

function ensureContext (env) {
  return env.renderingContext || (env.renderingContext = emptyContext())
}

/**
 * Factories
 *
 * Usage:
 *   const createClass = reactiveCreateClass(React.createClass, env)
 *   const transformType = cachingTransformType(createClass)
 *   React.createElement = createCreateElement(transformType)
 */

exports.createCreateElement = createCreateElement
function createCreateElement (transformType) {
  validate(isFunction, transformType)
  return function createElement () {
    arguments[0] = transformType(...arguments)
    return ReactElement.createElement(...arguments)
  }
}

exports.cachingTransformType = cachingTransformType
function cachingTransformType (createClass) {
  validate(isFunction, createClass)

  function funToConfig (render) {
    return {...render, render}
  }

  return function transformType (type) {
    return (
      isFunction(type) && type.prototype && !type.prototype.render
      ? type.prototype.class || (type.prototype.class = createClass(funToConfig(type)))
      : isDict(type)
      ? type.class || (type.class = createClass(type))
      : type
    )
  }
}

exports.reactiveCreateClass = reactiveCreateClass
function reactiveCreateClass (createClass, env, additionalContext) {
  validate(isFunction, createClass)
  validate(isObject, env)

  return function reactiveCreateClass_ (config) {
    return createClass({
      displayName: config.render.name,
      ...config,
      ...methods,
      env,
      _additionalContext: additionalContext,
      _originalRender: config.render,
      _originalWillMount: config.componentWillMount,
      _originalDidMount: config.componentDidMount,
      _originalDidUpdate: config.componentDidUpdate,
      _originalWillUnmount: config.componentWillUnmount,
    })
  }
}

// Usage:
//   env.addWatcher(delayingWatcher(renderingWatcher))
//   env.addWatcher(delayingWatcher(seq(renderingWatcher, myPostRender)))
// A callback run just after `renderingWatcher` can make use of the
// `env.renderingContext` built up during the last render phase.
exports.renderingWatcher = renderingWatcher
function renderingWatcher (env, prev, next) {
  env.renderingContext = emptyContext()

  if (!env.views) env.views = []

  env.views.forEach(function maybeUpdateView (view) {
    if (isAlive(view) && cursorsChanged(view._paths, prev, next)) view.forceUpdate()
  })
}

/**
 * Utils
 */

function emptyContext () {
  return {rendered: [], removed: []}
}

const isAlive = not(isDead)

function isDead (view) {
  return hasOwnProperty.call(view, '_reactInternalInstance') && (
    !view._reactInternalInstance ||
    view._reactInternalInstance._calledComponentWillUnmount
  )
}
