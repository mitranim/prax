'use strict'

const deepEqual = require('emerge').deepEqual
const toTest = require('./mb').toTest

// Takes a component class, such as React.Component, and an atom's watch
// function. Returns a function that creates a subclass of this component from a
// vanilla JavaScript function. The resulting component is reactive: if the
// function accesses the atom data, the component will automatically update when
// that data is changed. See examples in docs.
exports.createAuto = createAuto
function createAuto (Component, watch) {
  validateFunc(Component)
  validateFunc(watch)

  return function auto (renderFunc) {
    return class Auto extends Component {
      static displayName = renderFunc.name || renderFunc.displayName || 'Auto';

      componentWillUnmount () {
        if (this._unsub) this._unsub()
      }

      // Works best for minimal props and states, like object ids.
      shouldComponentUpdate (props) {
        return !deepEqual(props, this.props)
      }

      _render (arg) {
        this._dom = renderFunc(this.props, arg)
      }

      render () {
        if (this._unsub) this._unsub()
        this._unsub = watch(duo(this._render, update, this))
        return this._dom
      }
    }
  }
}

// Creates a decorator that makes the decorated component class reactive based
// on the given watch func. If it accesses the atom data in its `render` method,
// it's going to be automatically updated when the data is changed. See examples
// in docs.
exports.createReactiveRender = createReactiveRender
function createReactiveRender (watch) {
  validateFunc(watch)

  return function reactiveRender (Component) {
    return class Reactive extends Component {
      static displayName = Component.name || Component.displayName || 'Reactive';

      componentWillUnmount () {
        if (this._unsub) this._unsub()
        if (typeof super.componentWillUnmount === 'function') {
          super.componentWillUnmount()
        }
      }

      // Prevent unnecessary renders caused by ancestor components. This works
      // best if props and state are kept to the minimum.
      shouldComponentUpdate (props, state) {
        return !deepEqual(props, this.props) || !deepEqual(state, this.state)
      }

      _render (arg) {
        this._dom = super.render(arg)
      }

      render () {
        if (this._unsub) this._unsub()
        this._unsub = watch(duo(this._render, update, this))
        return this._dom
      }
    }
  }
}

// Creates a decorator that makes the decorated method of a React component
// reactive relative to the given watch function. The method is automatically
// called in `componentWillMount`; if it accesses the atom data, it's
// automatically rerun when the data is changed. See examples in docs.
exports.createReactiveMethod = createReactiveMethod
function createReactiveMethod (watch) {
  validateFunc(watch)

  return function (target, name, descriptor) {
    // Probably a `React.Component`-derived class.
    if (target.constructor && target.constructor !== Object) {
      const pre = target.componentWillMount
      const post = target.componentWillUnmount

      target.componentWillMount = function () {
        if (typeof pre === 'function') pre.call(this)
        if (typeof this[name] !== 'function') return
        if (!isBound(this[name])) this[name] = this[name].bind(this)
        const unsubs = this._unsubs || (this._unsubs = [])
        unsubs.push(watch(this[name]))
      }

      target.componentWillUnmount = function () {
        while (this._unsubs.length) this._unsubs.shift()()
        if (typeof post === 'function') post.call(this)
      }

      return
    }

    // Probably an oldschool React class.
    if (typeof target.displayName === 'string') {
      if (!target.mixins) target.mixins = []

      target.mixins.push({
        componentWillMount () {
          const unsubs = this._unsubs || (this._unsubs = [])
          unsubs.push(watch(this[name]))
        },
        componentWillUnmount () {
          while (this._unsubs.length) this._unsubs.shift()()
        }
      })
    }
  }
}

// Creates a decorator that subscribes a method of the given React component to
// the given `match` of a message bus, and unsubscribes it when the component is
// unmounted.
exports.createMatchDecorator = createMatchDecorator
function createMatchDecorator (match) {
  return function (pattern) {
    const test = toTest(pattern)

    return function (target, name, descriptor) {
      // Probably a `React.Component`-derived class.
      if (target.constructor && target.constructor !== Object) {
        const pre = target.componentWillMount
        const post = target.componentWillUnmount

        target.componentWillMount = function () {
          if (typeof pre === 'function') pre.call(this)
          if (typeof this[name] !== 'function') return
          if (!isBound(this[name])) this[name] = this[name].bind(this)
          const unsubs = this._unsubs || (this._unsubs = [])
          unsubs.push(match(test.bind(this), this[name]))
        }

        target.componentWillUnmount = function () {
          while (this._unsubs.length) this._unsubs.shift()()
          if (typeof post === 'function') post.call(this)
        }

        return
      }

      // Probably an oldschool React class.
      if (typeof target.displayName === 'string') {
        if (!target.mixins) target.mixins = []

        target.mixins.push({
          componentWillMount () {
            const unsubs = this._unsubs || (this._unsubs = [])
            unsubs.push(match(test.bind(this), this[name]))
          },
          componentWillUnmount () {
            while (this._unsubs.length) this._unsubs.shift()()
          }
        })
      }
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
  return arg => {
    i++
    if (i === 1) first.call(thisArg, arg)
    else if (i === 2) second.call(thisArg)
  }
}

function validateFunc (value) {
  if (typeof value !== 'function') throw Error(`Expected a function, got: ${value}`)
}

function update () {
  if (this.hasOwnProperty('_reactInternalInstance') && !this._reactInternalInstance) {
    return
  }
  this.forceUpdate()
}
