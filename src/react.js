import {Component} from 'react'
import * as v from './view'
import * as m from './misc'

export * from './misc'
export {RenderQue, isComponent, reactEqual} from './view'

// Enables implicit reactivity similar to `espo.Reaction`.
// Enables batching of view updates via `RenderQue.global`.
// Catches render exceptions to ensure `componentWillUnmount` is called even
// when rendering fails, preventing subscription leaks.
export function PraxComponent() {
  m.validateInstance(this, PraxComponent)
  Component.apply(this, arguments)

  // Overrides
  this.render = v.praxRender
  this.componentDidMount = v.praxComponentDidMount
  this.componentDidUpdate = v.praxComponentDidUpdate
  this.componentWillUnmount = v.praxComponentWillUnmount

  // Prax-specific properties
  this.deref = this.$ = v.praxDeref.bind(this)
  this.subscriptions = undefined
  this.nextSubscriptions = undefined
  this.scheduleUpdate = undefined
  this.rendering = false
}

const PCP = PraxComponent.prototype = Object.create(Component.prototype)

// Prevents unnecessary re-renders. For best performance, props and state
// should be kept shallow, and large data should be sideloaded from Espo
// observables. If a component needs large data in props or state,
// it should override this. Measure first!
PCP.shouldComponentUpdate = function shouldComponentUpdate(props, state) {
  return !v.reactEqual(this.props, props) || !v.reactEqual(this.state, state)
}

PCP.renderQue = v.RenderQue.global

PraxComponent.enableReactivity = true
