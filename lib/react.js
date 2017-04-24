'use strict'

const React = require('react')
const {equalBy} = require('emerge')
const {includes, noop, isFunction} = require('fpx')
const {Que, Runner, bindAll} = require('espo')

/**
 * Classes
 */

// Purpose: batching view updates. When running multiple data updates that could
// trigger multiple render phases, we can .dam() the shared render que, update,
// then flush the que, avoiding redundant renders.
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
    this.runner = new Runner()
    this._enqueUpdate = enqueUpdate.bind(this)
    if (isFunction(this.subrender)) this.subrender = this.subrender.bind(this)
  }

  componentWillMount () {
    if (isFunction(this.setup)) this.setup(this.props, this.state)
  }

  componentWillReceiveProps (props) {
    if (isFunction(this.setup) && this.shouldComponentUpdate(props, this.state)) {
      this.setup(props, this.state)
    }
  }

  // Prevents unnecessary renders caused by ancestor instances. Works best if
  // props and state are kept shallow. Considers ALL functions equal, as it's
  // exceedingly rare to receive legitimately different functions in props; I'm
  // yet to encounter that.
  shouldComponentUpdate (props, state) {
    return !pseudoEqual(props, this.props) || !pseudoEqual(state, this.state)
  }

  // React fails to unmount components that throw an exception during a `render`
  // call. This screws up resource cleanup and seems to sometimes cause React to
  // get stuck in an inconsistent state, breaking it. Replacing exceptions with
  // console reports circumvents the problem.
  render () {
    if (!isFunction(this.subrender)) return null
    try {
      return this.runner.run(this.subrender, this._enqueUpdate)
    }
    catch (err) {
      console.error(err)
      return null
    }
  }

  componentWillUnmount () {
    this.renderQue.pull(this)
    this.runner.deinit()
  }
}

exports.PraxComponent = PraxComponent

PraxComponent.prototype.renderQue = RenderQue.globalRenderQue

function pseudoEqual (one, other) {
  return isFunction(one) && isFunction(other) || equalBy(pseudoEqual, one, other)
}

function enqueUpdate () {
  this.renderQue.push(this)
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
  return value && isFunction(value.forceUpdate) && !value._calledComponentWillUnmount
}
