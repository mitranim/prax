'use strict'

const React = require('react')
const {equalBy, equal} = require('emerge')
const {includes, isFunction} = require('fpx')
const {Que, Reaction, bindAll} = require('espo')

/**
 * Classes
 */

// Purpose: batching view updates. When running multiple data updates that could
// trigger multiple render phases, we can .dam() the shared render que, update,
// then flush the que, avoiding redundant renders that could have happened
// during the update.
class RenderQue extends Que {
  constructor () {
    super(maybeUpdateInstance)
    if (this.constructor === RenderQue) bindAll(this)
  }

  push (value) {
    if (isActiveInstance(value) && !includes(this.pending, value)) super.push(value)
  }

  static global = new RenderQue()
}

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
// console reports circumvents the problem.
class PraxComponent extends React.PureComponent {
  constructor () {
    super(...arguments)
    this.reaction = new Reaction()
    this.scheduleUpdate = scheduleUpdate.bind(this)
    if (isFunction(this.subrender)) this.subrender = this.subrender.bind(this)
  }

  componentWillMount () {
    if (isFunction(this.setup)) runSetup.call(this, this.props, this.state)
  }

  componentWillReceiveProps (props) {
    if (isFunction(this.setup) && this.shouldComponentUpdate(props, this.state)) {
      runSetup.call(this, props, this.state)
    }
  }

  // Prevents unnecessary renders caused by ancestor instances. Works best if
  // props and state are kept shallow.
  shouldComponentUpdate (props, state) {
    return !equal(props, this.props) || !equal(state, this.state)
  }

  render () {
    if (!isFunction(this.subrender)) return null
    try {
      return this.reaction.run(this.subrender, this.scheduleUpdate)
    }
    catch (err) {
      console.error(err)
      return null
    }
  }

  componentWillUnmount () {
    this.renderQue.pull(this)
    this.reaction.deinit()
  }
}

exports.PraxComponent = PraxComponent

PraxComponent.prototype.renderQue = RenderQue.global

function scheduleUpdate () {
  this.renderQue.push(this)
}

function runSetup (props, state) {
  try {
    this.setup(props, state)
  }
  catch (err) {
    console.error(err)
  }
}

/**
 * Utils
 */

exports.maybeUpdateInstance = maybeUpdateInstance
function maybeUpdateInstance (instance) {
  if (isActiveInstance(instance)) instance.forceUpdate()
}

exports.isActiveInstance = isActiveInstance
function isActiveInstance (value) {
  return Boolean(value) && isFunction(value.forceUpdate) && !value._calledComponentWillUnmount
}

// Utility for extra paranoid `shouldComponentUpdate`.
exports.pseudoEqual = pseudoEqual
function pseudoEqual (one, other) {
  return isFunction(one) && isFunction(other) || equalBy(pseudoEqual, one, other)
}
