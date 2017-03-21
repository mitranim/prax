'use strict'

const React = require('react')
const {bind, truthy, testOr, isFunction, isDict, validate} = require('fpx')
const {getIn, equal} = require('emerge')
const {cursorsChanged} = require('./bc')
const {RenderQue: {globalRenderQue}} = require('./react')
const pub = exports

/**
 * Transforms
 */

pub.cachingTypeTransform = cachingTypeTransform
function cachingTypeTransform (transform) {
  return bind(tranformAndCacheType, transform)
}

function tranformAndCacheType (transform, type) {
  return (
    isFunction(type) && type.prototype
    ? type.prototype.transformed || (type.prototype.transformed = transform(type))
    : isFunction(type) || isDict(type)
    ? type.transformed || (type.transformed = transform(type))
    : type
  )
}

pub.coerceToComponentClass = coerceToComponentClass
function coerceToComponentClass (type) {
  return (
    isReactComponentType(type)
    ? type
    : isDict(type)
    ? React.createClass(type)
    : functionToComponentClass(type)
  )
}

pub.functionToComponentClass = functionToComponentClass
function functionToComponentClass (render) {
  validate(isFunction, render)

  return React.createClass({
    displayName: getDisplayName(render),
    ...render,
    render () {
      return render.call(this, this.props, this.context)
    },
  })
}

// Prevents unnecessary renders caused by ancestor instances. This works best
// if props and state are kept to the minimum.
function shouldComponentUpdate (props, state) {
  return !equal(props, this.props) || !equal(state, this.state)
}

// React fails to unmount components that throw an exception during a `render`
// call. This screws up resource cleanup and seems to sometimes cause React to
// get stuck in an inconsistent state, breaking it. Replacing exceptions with
// console reports circumvents the problem.
pub.safeRenderingComponentProps = safeRenderingComponentProps
function safeRenderingComponentProps (Component) {
  const {prototype: {render}} = Component

  return {
    displayName: getDisplayName(Component),

    render () {
      if (!render) return null
      try {
        return render.apply(this, arguments)
      }
      catch (err) {
        console.error(err)
        return null
      }
    },
  }
}

pub.atomComponentProps = atomComponentProps
function atomComponentProps (atom, staticContext) {
  if (!isFunction(atom.addWatcher)) {
    throw Error(`Expected an atom with an 'addWatcher' method`)
  }

  return function atomComponentProps_ (Component) {
    const {prototype: {componentWillMount, componentWillUnmount, render}} = Component

    return {
      displayName: getDisplayName(Component),

      renderQue: globalRenderQue,

      componentWillMount () {
        this.store = atom
        this.context = {...staticContext, ...this.context}
        this.renderWatcher = atom.addWatcher(maybeUpdate.bind(this))
        this._paths = []
        if (componentWillMount) componentWillMount.apply(this, arguments)
      },

      componentWillUnmount () {
        this.renderQue.pull(this)
        if (this.renderWatcher) this.renderWatcher()
        if (componentWillUnmount) componentWillUnmount.apply(this, arguments)
      },

      render () {
        if (!render) return null

        let paths = []

        function read () {
          if (paths) paths.push(arguments)
          return getIn(atom.state, arguments)
        }

        this.context = {...staticContext, ...this.context, read}

        try {
          const dom = render.call(this)
          this._paths = paths
          return dom
        }
        finally {
          paths = null
        }
      },

      shouldComponentUpdate,
    }
  }
}

function maybeUpdate (_atom, prev, next) {
  if (cursorsChanged(this._paths, prev, next)) this.renderQue.push(this)
}

/**
 * Utils
 */

pub.isReactComponentType = isReactComponentType
function isReactComponentType (value) {
  return isReactComponentType_(value)
}

const isReactComponentType_ = testOr(
  {prototype: {isReactComponent: truthy}},
  {prototype: {isPureReactComponent: truthy}}
)

function getDisplayName (Component) {
  return (
    (Component.prototype && Component.prototype.displayName) ||
    Component.displayName ||
    Component.name
  )
}
