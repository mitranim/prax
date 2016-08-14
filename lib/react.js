'use strict'

const React = require('react')
const ReactElement = require('react/lib/ReactElement')
const {equal, is} = require('emerge')
const {bind, scan, append, remove, includes, foldl,
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
    if (this._willMount) this._willMount(...arguments)
  },

  componentDidMount () {
    const context = ensureContext(this.env)
    context.rendered = adjoin(context.rendered, this)
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
 * TODO examples in docs
 */

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

  return React.createElement = ReactElement.createElement = createElement
}

exports.cachingClassTransform = cachingClassTransform
function cachingClassTransform (createClass) {
  validate(isFunction, createClass)

  function funToConfig (render) {
    return {...render, render}
  }

  return type => (
    isFunction(type) && type.prototype && !type.prototype.render
    ? type.prototype.class || (type.prototype.class = createClass(funToConfig(type)))
    : isPlainObject(type)
    ? type.class || (type.class = createClass(type))
    : type
  )
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
    render: function legacyRenderAdapter (props, {read, env: {send}}) {
      return config.render.call(this, props, read, send)
    }
  }
}

exports.renderingWatch = renderingWatch
function renderingWatch (renderRoot) {
  validate(isFunction, renderRoot)

  return function runRenderingWatch (_key, env, prev, next) {
    if (is(prev, next)) return

    const {rendered, removed} = env.renderingContext || emptyContext()

    env.renderingContext = emptyContext()

    env.views = mergeViewSets(env.views || [], rendered, removed)

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

// Probably slow-ish, probably good enough
function mergeViewSets (views, rendered, removed) {
  return foldl(remove, foldl(adjoin, views, rendered), removed)
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
