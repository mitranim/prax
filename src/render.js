/* eslint-disable no-invalid-this */

import * as es from 'espo'
import * as f from 'fpx'
import * as m from './misc'

// Purpose: batching view updates. When updating observables in a way that can
// trigger multiple redundant renders, we can `.dam()` the shared render que,
// update the observables, then flush the que, rendering only once.
export function RenderQue() {
  m.validateInstance(this, RenderQue)
  es.Que.call(this, forceUpdate)
}

const RQP = RenderQue.prototype = Object.create(es.Que.prototype)

RQP.push = function push(value) {
  f.validate(value, isComponent)
  if (this.has(value)) return
  es.Que.prototype.push.call(this, value)
}

RenderQue.global = new RenderQue()

function forceUpdate(value) {value.forceUpdate()}

export function isComponent(value) {
  return f.isObject(value) && f.isFunction(value.forceUpdate)
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
