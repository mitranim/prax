'use strict'

const deepEqual = require('emerge').deepEqual

// Takes a component class, such as React.Component, and an atom. Returns a
// function that creates a subclass of this component from a vanilla JavaScript
// function. The resulting component is reactive: if the function accesses the
// atom data, the component will automatically update when that data is changed.
// See examples in docs.
exports.createAuto = createAuto
function createAuto (Component, atom) {
  validateAtom(atom)
  const watch = atom.watch
  const stop = atom.stop

  return function auto (renderFunc) {
    return class Auto extends Component {
      static displayName = renderFunc.name || renderFunc.displayName || 'Auto'

      componentWillUnmount () {
        stop(this._next)
      }

      // Works best for minimal props and states, like object ids.
      shouldComponentUpdate (props) {
        return !deepEqual(props, this.props)
      }

      _render () {
        this._dom = renderFunc(this.props)
      }

      render () {
        stop(this._next)
        this._next = duo(this._render, update, this)
        watch(this._next)
        return this._dom
      }
    }
  }
}

// Creates a decorator that makes the decorated component class reactive
// relative to the given atom. If it accesses the atom data in its `render`
// method, it's going to be automatically updated when the data is changed. See
// examples in docs.
exports.createReactiveRender = createReactiveRender
function createReactiveRender (atom) {
  validateAtom(atom)
  const watch = atom.watch
  const stop = atom.stop

  return function reactiveRender (Component) {
    return class Reactive extends Component {
      static displayName = Component.name || Component.displayName || 'Reactive'

      componentWillUnmount () {
        stop(this._next)
        if (typeof super.componentWillUnmount === 'function') {
          super.componentWillUnmount()
        }
      }

      // Prevent unnecessary renders caused by ancestor components. This works
      // best if props and state are kept to the minimum.
      shouldComponentUpdate (props, state) {
        return !deepEqual(props, this.props) || !deepEqual(state, this.state)
      }

      _render () {
        this._dom = super.render()
      }

      render () {
        stop(this._next)
        this._next = duo(this._render, update, this)
        watch(this._next)
        return this._dom
      }
    }
  }
}

// Creates a decorator that makes the decorated method of a React component
// reactive relative to the given atom. The method is automatically called in
// `componentWillMount`; if it accesses the atom data, it's automatically rerun
// when the data is changed. See examples in docs.
exports.createReactiveMethod = createReactiveMethod
function createReactiveMethod (atom) {
  validateAtom(atom)
  const watch = atom.watch
  const stop = atom.stop

  return function reactive (target, name, descriptor) {
    const func = descriptor.value
    if (typeof func !== 'function') return

    if (target.constructor && target.constructor !== Object) {
      // Probably a `React.Component`-derived class.
      const pre = target.componentWillMount
      const post = target.componentWillUnmount

      target.componentWillMount = function () {
        if (typeof pre === 'function') pre.call(this)
        if (!isBound(this[name])) this[name] = func.bind(this)
        watch(this[name])
      }

      target.componentWillUnmount = function () {
        stop(this[name])
        if (typeof post === 'function') post.call(this)
      }

      return
    }

    // Probably an oldschool React class.
    if (typeof target.displayName === 'string') {
      if (!target.mixins) target.mixins = []

      target.mixins.push({
        componentWillMount () {
          watch(this[name])
        },
        componentWillUnmount () {
          stop(this[name])
        }
      })
    }
  }
}

/**
 * Utils
 */

function isBound (func) {
  return typeof func === 'function' && (!func.prototype || /^bound\b/.test(func.name))
}

function duo (first, second, thisArg) {
  let i = 0
  return () => {
    i++
    if (i === 1) first.call(thisArg)
    else if (i === 2) second.call(thisArg)
  }
}

function validateAtom (atom) {
  if (atom && typeof atom.watch === 'function' && typeof atom.stop === 'function') {
    return
  }
  throw TypeError(`Expected an atom with 'watch' and 'stop' methods, got: ${atom}`)
}

function update () {
  if (this.hasOwnProperty('_reactInternalInstance') && !this._reactInternalInstance) {
    return
  }
  this.forceUpdate()
}
