import * as r from 'react'
import * as e from 'emerge'
import * as f from 'fpx'
import * as es from 'espo'

/**
 * Classes
 */

// Purpose: batching view updates. When updating observables in a way that can
// trigger multiple redundant renders, we can `.dam()` the shared render que,
// update the observables, then flush the que, rendering only once.
export class RenderQue extends es.Que {
  static global = new RenderQue()

  constructor() {
    super(forceUpdate)
  }

  push(value) {
    f.validate(value, isComponent)
    if (!f.includes(this.pending, value)) super.push(value)
  }
}

// Enables implicit reactivity similar to `espo.Reaction`.
// Enables batching of view updates via `RenderQue.global`.
// Catches render exceptions to ensure `componentWillUnmount` is called even
// when rendering fails, preventing subscription leaks.
export class PraxComponent extends r.Component {
  constructor() {
    super(...arguments)

    // Overrides
    this.render = praxRender
    this.componentDidMount = praxComponentDidMount
    this.componentDidUpdate = praxComponentDidUpdate
    this.componentWillUnmount = praxComponentWillUnmount

    // Prax-specific properties
    this.deref = deref.bind(this)
    this.subscriptions = undefined
    this.nextSubscriptions = undefined
    this.scheduleUpdate = undefined
    this.rendering = false
  }

  // Prevents unnecessary re-renders. For best performance, props and state
  // should be kept shallow, and large data should be sideloaded from Espo
  // observables. If a component needs large data in props or state,
  // it should override this. Measure first!
  shouldComponentUpdate(props, state) {
    return !reactEqual(this.props, props) || !reactEqual(this.state, state)
  }
}

PraxComponent.prototype.renderQue = RenderQue.global

PraxComponent.enableReactivity = true

/**
 * Utils
 */

export function isComponent(value) {
  return f.isObject(value) && f.isFunction(value.forceUpdate)
}

export function reactEqual(left, right) {
  return r.isValidElement(left)
    ? r.isValidElement(right) && elemEqual(left, right)
    : e.equalBy(left, right, reactEqual)
}

function elemEqual(left, right) {
  return (
    e.is(left.type, right.type) &&
    e.is(left.key, right.key) &&
    propsEqual(left.props, right.props)
  )
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

function forceUpdate(value) {
  value.forceUpdate()
}

function deref(value) {
  f.validate(value, es.isObservableRef)
  const component = this  // eslint-disable-line no-invalid-this

  if (!component.constructor.enableReactivity || !component.rendering) {
    return value.deref()
  }

  if (!component.nextSubscriptions) {
    component.nextSubscriptions = []
  }
  if (!component.scheduleUpdate) {
    component.scheduleUpdate = scheduleUpdate.bind(component)
  }
  component.nextSubscriptions.push(value.subscribe(component.scheduleUpdate))
  return value.deref()
}

function scheduleUpdate() {
  const component = this  // eslint-disable-line no-invalid-this
  component.renderQue.push(component)
}

function praxRender() {
  const component = this  // eslint-disable-line no-invalid-this
  const {render} = component.constructor.prototype

  if (!f.isFunction(render)) return null

  component.rendering = true
  try {
    return render.call(component, component)
  }
  catch (err) {
    console.error(err)
    clearSubscriptions(component)
    return null
  }
  finally {
    component.rendering = false
  }
}

function praxComponentDidMount() {
  const component = this  // eslint-disable-line no-invalid-this
  migrateSubscriptions(component)
  const {componentDidMount} = component.constructor.prototype
  if (componentDidMount) componentDidMount.call(component)
}

function praxComponentDidUpdate() {
  const component = this  // eslint-disable-line no-invalid-this
  migrateSubscriptions(component)
  const {componentDidUpdate} = component.constructor.prototype
  if (componentDidUpdate) componentDidUpdate.call(component)
}

function praxComponentWillUnmount() {
  const component = this  // eslint-disable-line no-invalid-this

  clearSubscriptions(component)
  component.renderQue.pull(component)

  const {componentWillUnmount} = component.constructor.prototype
  if (componentWillUnmount) componentWillUnmount.call(component)
}

function migrateSubscriptions(component) {
  const {subscriptions, nextSubscriptions} = component
  component.subscriptions = nextSubscriptions
  component.nextSubscriptions = subscriptions
  if (subscriptions) es.flushBy(subscriptions, es.deinit)
}

function clearSubscriptions(component) {
  const {subscriptions, nextSubscriptions} = component
  try {
    if (subscriptions) es.flushBy(subscriptions, es.deinit)
  }
  finally {
    if (nextSubscriptions) es.flushBy(nextSubscriptions, es.deinit)
  }
}
