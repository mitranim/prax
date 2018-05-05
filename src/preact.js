import {Component} from 'preact'
import * as f from 'fpx'
import * as e from 'emerge'
import * as r from './render'
import * as m from './misc'

export * from './misc'
export {RenderQue, isComponent} from './render'

// Enables implicit reactivity similar to `espo.Reaction`.
// Enables batching of view updates via `RenderQue.global`.
// Catches render exceptions to ensure `componentWillUnmount` is called even
// when rendering fails, preventing subscription leaks.
export function PraxComponent() {
  m.validateInstance(this, PraxComponent)
  Component.apply(this, arguments)

  // Overrides
  this.render = r.praxRender
  this.componentDidMount = r.praxComponentDidMount
  this.componentDidUpdate = r.praxComponentDidUpdate
  this.componentWillUnmount = r.praxComponentWillUnmount

  // Prax-specific properties
  this.deref = this.$ = r.praxDeref.bind(this)
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
  return !reactEqual(this.props, props) || !reactEqual(this.state, state)
}

PCP.renderQue = r.RenderQue.global

PraxComponent.enableReactivity = true

export function reactEqual(left, right) {
  return isPreactElement(left)
    ? isPreactElement(right) && preactElemEqual(left, right)
    : e.equalBy(left, right, reactEqual)
}

/**
 * Internal
 */

function isPreactElement(value) {
  return f.isObject(value) && (f.isString(value.nodeName) || f.isFunction(value.nodeName))
}

function preactElemEqual(left, right) {
  return (
    e.is(left.nodeName, right.nodeName) &&
    e.is(left.key, right.key) &&
    attrsEqual(left.attributes, right.attributes) &&
    reactEqual(left.children, right.children)
  )
}

function attrsEqual(left, right) {
  for (const key in left) {
    if (!reactEqual(left[key], right[key])) return false
  }

  for (const key in right) {
    if (key === 'children') continue
    if (!reactEqual(left[key], right[key])) return false
  }

  return true
}
