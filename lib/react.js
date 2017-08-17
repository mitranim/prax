'use strict'

const React = require('react')
const {is, equalBy} = require('emerge')
const {includes, isFunction, isObject} = require('fpx')
const {Que, Reaction, bindAll} = require('espo')

const {$$typeof: elementMarker} = React.createElement('div')

/**
 * Classes
 */

// Purpose: batching view updates. When running multiple data updates that could
// trigger multiple render phases, we can .dam() the shared render que, update,
// then flush the que, avoiding redundant renders that could have happened
// during the update.
class RenderQue extends Que {
  constructor() {
    super(forceUpdateInstance)
    if (this.constructor === RenderQue) bindAll(this)
  }

  push(value) {
    if (isComponentInstance(value) && !includes(this.pending, value)) super.push(value)
  }
}

RenderQue.global = new RenderQue()

exports.RenderQue = RenderQue

// Enables implicit reactivity driven by procedural data access (adapts React
// views to espo.Reaction). Enables custom batching of view updates via
// RenderQue.global. Safely handles exceptions in lifecycle methods to ensure
// proper resource cleanup.
//
// Note on exception handling. React fails to unmount components that throw an
// exception during a lifecycle method such as `render` or `componentWillMount`.
// This screws up resource cleanup and seems to sometimes cause React to get
// stuck in an inconsistent state, breaking it. Replacing exceptions with
// console reports circumvents the problem. (Note: need to check behavior in
// React 16+.)
class PraxComponent extends React.Component {
  constructor() {
    super(...arguments)
    this.reaction = new Reaction()
    this.scheduleUpdate = this.renderQue.push.bind(this.renderQue, this)
    if (isFunction(this.subrender)) this.subrender = this.subrender.bind(this)
  }

  // Prevents unnecessary renders caused by ancestor instances. Works best if
  // props and state are kept shallow.
  shouldComponentUpdate(props, state) {
    return !reactEqual(this.props, props) || !reactEqual(this.state, state)
  }

  componentWillUnmount() {
    this.renderQue.pull(this)
    this.reaction.deinit()
  }

  render() {
    if (!isFunction(this.subrender)) return null
    try {
      return this.reaction.run(this.subrender, this.scheduleUpdate)
    }
    catch (err) {
      console.error(err)
      return null
    }
  }
}

exports.PraxComponent = PraxComponent

PraxComponent.prototype.renderQue = RenderQue.global

/**
 * Utils
 */

function forceUpdateInstance (instance) {
  instance.forceUpdate()
}

exports.isComponentInstance = isComponentInstance
function isComponentInstance (value) {
  return isObject(value) && isFunction(value.forceUpdate)
}

exports.isElement = isElement
function isElement(value) {
  return isObject(value) && value.$$typeof === elementMarker
}

exports.reactEqual = reactEqual
function reactEqual(left, right) {
  return isElement(left) && isElement(right)
    ? elemEqual(left, right)
    : equalBy(reactEqual, left, right)
}

function elemEqual(left, right) {
  return is(left.type, right.type) &&
    is(left.key, right.key) &&
    propsEqual(left.props, right.props)
}

function propsEqual(left, right) {
  for (const key in left) {
    if (key === 'children') continue
    if (!reactEqual(left[key], right[key])) return false
  }

  for (const key in right) {
    if (key === 'children') continue
    if (!reactEqual(left[key], right[key])) return false
  }

  return reactEqual(left.children, right.children)
}

// Utility for extra paranoid `shouldComponentUpdate`.
exports.reactPseudoEqual = reactPseudoEqual
function reactPseudoEqual (left, right) {
  return isFunction(left) && isFunction(right) || (
    isElement(left, right)
    ? elemEqual(left, right)
    : equalBy(reactPseudoEqual, left, right)
  )
}
