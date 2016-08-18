'use strict'

const React = require('react')
const ReactElement = require('react/lib/ReactElement')
const {equal, is} = require('emerge')
const {bind, scan, append, remove, includes,
       isFunction, isObject, isPlainObject, validate} = require('fpx')
const {hasOwnProperty} = Object.prototype
const {cursorsChanged, logArgs} = require('./words')

/**
 * Methods
 */

const methods = {
  // Prevents unnecessary renders caused by ancestor views. This works best if
  // props and state are kept to the minimum.
  shouldComponentUpdate (props, state) {
    return !equal(props, this.props) || !equal(state, this.state)
  },

  componentWillUnmount () {
    const context = ensureContext(this.env)
    context.removed = adjoin(context.removed, this)
    context.rendered = remove(context.rendered, this)
    this.env.views = remove(this.env.views, this)
    if (this._willMount) this._willMount(...arguments)
  },

  componentDidMount () {
    const context = ensureContext(this.env)
    context.rendered = adjoin(context.rendered, this)
    this.env.views = adjoin(this.env.views, this)
    if (this._didMount) this._didMount(...arguments)
  },

  componentDidUpdate () {
    const context = ensureContext(this.env)
    context.rendered = adjoin(context.rendered, this)
    if (this._didUpdate) this._didUpdate(...arguments)
  },

  render () {
    const [dom, paths] = logArgs.call(this, bind(scan, this.env.state), runRender)
    this._paths = paths
    return dom
  }
}

function runRender (read) {
  return this._render(this.props, {...this.context, ...this._context, read, env: this.env})
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

// Deprecated, see big comment above
exports.hackCreateElement = hackCreateElement
function hackCreateElement (transformType) {
  validate(isFunction, transformType)
  return React.createElement = function createElement () {
    arguments[0] = transformType(...arguments)
    return ReactElement.createElement(...arguments)
  }
}

exports.cachingTransformType = cachingTransformType
exports.cachingClassTransform = cachingTransformType  // BC alias
function cachingTransformType (createClass) {
  validate(isFunction, createClass)

  function funToConfig (render) {
    return {...render, render}
  }

  return function transformType (type) {
    return (
      isFunction(type) && type.prototype && !type.prototype.render
      ? type.prototype.class || (type.prototype.class = createClass(funToConfig(type)))
      : isPlainObject(type)
      ? type.class || (type.class = createClass(type))
      : type
    )
  }
}

exports.reactiveCreateClass = reactiveCreateClass
function reactiveCreateClass (createClass, env, context) {
  validate(isFunction, createClass)
  validate(isObject, env)

  return config => createClass({
    displayName: config.render.name,
    ...config,
    ...methods,
    env,
    _context: context,
    _render: config.render,
    _willMount: config.componentWillMount,
    _didMount: config.componentDidMount,
    _didUpdate: config.componentDidUpdate
  })
}

exports.adaptLegacyView = adaptLegacyView
function adaptLegacyView (config) {
  return {
    ...config,
    render: function legacyRenderAdapter (props, {read, env}) {
      return config.render.call(this, props, read, env.send, env)
    },
    displayName: config.displayName || config.render.name
  }
}

exports.renderingWatch = renderingWatch
function renderingWatch (renderRoot) {
  validate(isFunction, renderRoot)

  return function runRenderingWatch (_key, env, prev, next) {
    if (is(prev, next)) return

    env.renderingContext = emptyContext()

    if (!env.views) env.views = []

    env.views.forEach(function maybeUpdateView (view) {
      if (isAlive(view) && cursorsChanged(view._paths, prev, next)) view.forceUpdate()
    })

    // Running `renderRoot` here, on each tick, serves two purposes
    // (1) automatically bootstrap the view hierarchy after the first tick
    // (2) cause React to run the user-supplied post-render callback when done
    //
    // In the post-render callback, the user can make use of the
    // `env.renderingContext` built up during the last render phase.
    renderRoot()
  }
}

/**
 * Utils
 */

function adjoin (list, value) {
  return includes(list, value) ? list : append(list, value)
}

function emptyContext () {
  return {rendered: [], removed: []}
}

function isAlive (view) {
  return !isDead(view)
}

function isDead (view) {
  return (
    view._calledComponentWillUnmount ||
    hasOwnProperty.call(view, '_reactInternalInstance') && !view._reactInternalInstance
  )
}
