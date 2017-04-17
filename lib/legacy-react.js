'use strict'

const React = require('react')
const {equal} = require('emerge')
const {includes, noop, isFunction} = require('fpx')
const {Que, Deconstructor, Subber, bindAll} = require('espo')

/**
 * Classes
 */

class RenderQue extends Que {
  constructor () {
    super(maybeUpdateInstance)
    if (this.constructor === RenderQue) bindAll(this)
  }

  push (value) {
    return (
      isActiveInstance(value) && !includes(this.pending, value)
      ? super.push(value)
      : noop
    )
  }

  static globalRenderQue = new RenderQue()
}

exports.RenderQue = RenderQue

class PraxComponent extends React.PureComponent {
  constructor () {
    super(...arguments)
    this.dc = new Deconstructor()
    this.dc.subber = new Subber()
    this._enqueUpdate = this.renderQue.push.bind(this.renderQue, this)
    if (isFunction(this.subrender)) this.subrender = this.subrender.bind(this)
  }

  // React fails to unmount components that throw an exception during a `render`
  // call. This screws up resource cleanup and seems to sometimes cause React to
  // get stuck in an inconsistent state, breaking it. Replacing exceptions with
  // console reports circumvents the problem.
  render () {
    if (!isFunction(this.subrender)) return null
    try {
      return this.dc.subber.run(this.subrender, this._enqueUpdate)
    }
    catch (err) {
      console.error(err)
      return null
    }
  }

  // Prevents unnecessary renders caused by ancestor instances. Works best if
  // props and state are kept shallow.
  shouldComponentUpdate (props, state) {
    return !equal(props, this.props) || !equal(state, this.state)
  }

  componentWillUnmount () {
    this.renderQue.pull(this)
    this.dc.deconstructor()
  }
}

exports.PraxComponent = PraxComponent

PraxComponent.prototype.renderQue = RenderQue.globalRenderQue

/**
 * Utils
 */

exports.maybeUpdateInstance = maybeUpdateInstance
function maybeUpdateInstance (instance) {
  if (isActiveInstance(instance)) instance.forceUpdate()
}

exports.isActiveInstance = isActiveInstance
function isActiveInstance (value) {
  return value && isFunction(value.forceUpdate) && !value._calledComponentWillUnmount
}
