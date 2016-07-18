'use strict'

const {getIn, is, deepEqual} = require('emerge')
const {pipe, isFunction, validate} = require('fpx')
const {hasOwnProperty} = Object.prototype

/**
 * Methods
 */

const methods = {
  componentWillMount () {
    this._view = view(this)
    this._unsub = this._app.addView(this._view)
    if (this._mount) this._mount()
  },

  componentWillUnmount () {
    if (this._unmount) this._unmount()
    if (this._unsub) this._unsub()
    clearPaths.call(this)
  },

  // Prevents unnecessary renders caused by ancestor views. This works best if
  // props and state are kept to the minimum.
  shouldComponentUpdate (props, state) {
    return !deepEqual(props, this.props) || !deepEqual(state, this.state)
  },

  render () {
    clearPaths.call(this)
    const [paths, dom] = runRender(
      this._render,
      this._app.mean,
      this.props,
      this._app.enque
    )
    this._view.paths = paths
    registerPaths.call(this)
    return dom
  }
}

/**
 * Factories
 */

exports.Auto = Auto
function Auto (app, createClass) {
  return pipe(funToConfig, ReactiveClass(app, createClass))
}

exports.ReactiveClass = ReactiveClass
function ReactiveClass (app, createClass) {
  validate(isFunction, app.addView)
  validate(isFunction, app.enque)
  validate(isFunction, createClass)

  return function reactiveClass (config) {
    return createClass({
      ...config,
      ...methods,
      _app: app,
      _render: config.render,
      _mount: config.componentWillMount,
      _unmount: config.componentWillUnmount
    })
  }
}

/**
 * Utils
 */

function view (instance) {
  return {instance, paths: [], update}
}

function runRender (reader, state, props, enque) {
  const paths = []
  function read (...path) {
    paths.push(path)
    return getIn(state, path)
  }
  const value = reader(props, read, enque)
  return [paths.slice(), value]
}

function funToConfig (render) {
  validate(isFunction, render)
  return {render}
}

function update () {
  if (!dead(this.instance)) this.instance.forceUpdate()
}

function dead (inst) {
  return inst._calledComponentWillUnmount ||
    hasOwnProperty.call(inst, '_reactInternalInstance') &&
    !inst._reactInternalInstance
}

/**
 * Experimental
 */

function clearPaths () {
  this._view.paths.forEach(decPath, this._app.viewPaths)
}

function registerPaths () {
  this._view.paths.forEach(incPath, this._app.viewPaths)
}

function incPath (path) {
  const index = lookupIndex(this, path)
  if (~index) this[index][1]++
  else this.push([path, 1])
}

function decPath (path) {
  const index = lookupIndex(this, path)
  if (~index) {
    this[index][1]--
    if (!(this[index][1] > 0)) this.splice(index, 1)
  }
}

function lookupIndex (pairs, path) {
  for (let i = -1; ++i < pairs.length;) {
    if (listsEqual(pairs[i][0], path)) return i
  }
  return -1
}

function listsEqual (list0, list1) {
  if (list0.length !== list1.length) return false
  for (let i = -1; ++i < list0.length;) {
    if (!is(list0[i], list1[i])) return false
  }
  return true
}
