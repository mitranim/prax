/* eslint-disable no-invalid-this */

import * as es from 'espo'
import * as e from 'emerge'
import * as f from 'fpx'

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

function forceUpdate(value) {value.forceUpdate()}

export function isComponent(value) {
  return f.isObject(value) && f.isFunction(value.forceUpdate)
}

export function reactEqual(left, right) {
  return isReactElement(left)
    ? isReactElement(right) && reactElemEqual(left, right)
    : isPreactElement(left)
    ? isPreactElement(right) && preactElemEqual(left, right)
    : e.equalBy(left, right, reactEqual)
}

/**
 * Internal
 */

export function praxDeref(value) {
  f.validate(value, es.isObservableRef)
  if (!this.constructor.enableReactivity || !this.rendering) return value.deref()
  if (!this.nextSubscriptions) this.nextSubscriptions = []
  if (!this.scheduleUpdate) this.scheduleUpdate = scheduleUpdate.bind(this)
  this.nextSubscriptions.push(value.subscribe(this.scheduleUpdate))
  return value.deref()
}

function scheduleUpdate() {
  this.renderQue.push(this)
}

export function praxRender() {
  const {render} = proto(this)

  if (!f.isFunction(render)) return null

  this.rendering = true
  try {
    return render.call(this, this)
  }
  catch (err) {
    console.error(err)
    clearSubscriptions(this)
    return null
  }
  finally {
    this.rendering = false
  }
}

export function praxComponentDidMount() {
  migrateSubscriptions(this)
  const {componentDidMount} = proto(this)
  if (componentDidMount) componentDidMount.call(this)
}

export function praxComponentDidUpdate() {
  migrateSubscriptions(this)
  const {componentDidUpdate} = proto(this)
  if (componentDidUpdate) componentDidUpdate.call(this)
}

export function praxComponentWillUnmount() {
  clearSubscriptions(this)
  this.renderQue.pull(this)
  const {componentWillUnmount} = proto(this)
  if (componentWillUnmount) componentWillUnmount.call(this)
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

function proto(value) {
  return value.constructor.prototype
}

// function isVirtualElement(value) {
//   return isReactElement(value) || isPreactElement(value)
// }

function isReactElement(value) {
  return f.isDict(value) &&
    (f.isString(value.type) || f.isFunction(value.type)) &&
    f.isDict(value.props)
}

function isPreactElement(value) {
  return f.isObject(value) && (f.isString(value.nodeName) || f.isFunction(value.nodeName))
}

function reactElemEqual(left, right) {
  return (
    e.is(left.type, right.type) &&
    e.is(left.key, right.key) &&
    propsEqual(left.props, right.props)
  )
}

function preactElemEqual(left, right) {
  return (
    e.is(left.nodeName, right.nodeName) &&
    e.is(left.key, right.key) &&
    propsEqual(left.props, right.props) &&
    reactEqual(left.children, right.children)
  )
}

function propsEqual(left, right) {
  // In Preact, props can be `undefined`, and regular virtual elements are
  // special objects, not dicts.
  if (!f.isObject(left) || !f.isObject(right)) return left === right

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
