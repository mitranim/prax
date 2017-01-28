'use strict'

const ReactElement = require('react/lib/ReactElement')
const {equal} = require('emerge')
const {bind, scan, adjoin, remove, isFunction, isObject, isDict, validate} = require('fpx')
const {cursorsChanged, logCalls} = require('./words')
const {hasOwnProperty} = Object.prototype
const pub = exports

/**
 * Factories
 *
 * Usage:
 *   const createClass = reactiveCreateClass(React.createClass, env)
 *   const transformType = cachingTransformType(createClass)
 *   React.createElement = createCreateElement(transformType)
 */

pub.createCreateElement = createCreateElement
function createCreateElement (transformType) {
  validate(isFunction, transformType)
  return function createElement () {
    arguments[0] = transformType(...arguments)
    return ReactElement.createElement(...arguments)
  }
}

pub.cachingTransformType = cachingTransformType
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

pub.reactiveCreateClass = reactiveCreateClass
function reactiveCreateClass (createClass, env, additionalContext) {
  validate(isFunction, createClass)
  validate(isObject, env)

  return function reactiveCreateClass_ ({
    render, componentWillMount, componentDidMount, componentDidUpdate, componentWillUnmount,
    ...config
  }) {
    return createClass({
      displayName: render.name,
      env,
      _additionalContext: additionalContext,
      _originalRender: render,
      _originalWillMount: componentWillMount,
      _originalDidMount: componentDidMount,
      _originalDidUpdate: componentDidUpdate,
      _originalWillUnmount: componentWillUnmount,
      ...methods,
      ...config,
    })
  }
}

// Usage:
//   env.addWatcher(delayingWatcher(renderingWatcher))
//   env.addWatcher(delayingWatcher(seq(renderingWatcher, myPostRender)))
// A callback run just after `renderingWatcher` can make use of the
// `env.renderingContext` built up during the last render phase.
pub.renderingWatcher = renderingWatcher
function renderingWatcher (env, prev, next) {
  env.renderingContext = emptyContext()
  if (!env.views) env.views = []
  env.views.forEach(bind(maybeUpdateView, env, prev, next))
}

function maybeUpdateView (env, prev, next, view) {
  if (!isDead(view) && cursorsChanged(view._paths, prev, next)) {
    try {
      view.forceUpdate()
    } catch (err) {
      env.views = remove(env.views, view)
      console.error(err)
    }
  }
}

/**
 * View Methods
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

  // React fails to unmount components that throw an exception during a `render`
  // call. This screws up resource cleanup and seems to sometimes cause React to
  // get stuck in an inconsistent state, breaking it. Replacing exceptions with
  // console reports circumvents the problem.
  render () {
    try {
      const [dom, paths] = logCalls.call(this, runRender, bind(scan, this.env.state))
      this._paths = paths
      return dom
    } catch (err) {
      console.error(err)
      return null
    }
  },
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
 * Utils
 */

function emptyContext () {
  return {rendered: [], removed: []}
}

function isDead (view) {
  return hasOwnProperty.call(view, '_reactInternalInstance') && (
    !view._reactInternalInstance ||
    view._reactInternalInstance._calledComponentWillUnmount
  )
}
