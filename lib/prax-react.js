export * from './prax'
import {autorun, stop} from './prax'

/**
 * Component method decorator for reactive updates. Usage:
 *   class X extends React.Component {
 *     @reactive
 *     updateMe () {
 *       ...
 *     }
 *   }
 */
export function reactive (target, name, {value: func}) {
  if (typeof func !== 'function') return

  if (target.constructor && target.constructor !== Object) {
    // Probably `React.Component`-derived class.
    const {componentWillMount: pre, componentWillUnmount: post} = target

    target.componentWillMount = function () {
      if (typeof pre === 'function') pre.call(this)
      if (!isBound(this[name])) this[name] = func.bind(this)
      autorun(this[name])
    }

    target.componentWillUnmount = function () {
      stop(this[name])
      if (typeof post === 'function') post.call(this)
    }

    return
  }

  // Probably oldschool React class.
  if (typeof target.displayName === 'string') {
    if (!target.mixins) target.mixins = []

    target.mixins.push({
      componentWillMount () {
        autorun(this[name])
      },
      componentWillUnmount () {
        stop(this[name])
      }
    })
  }
}

/**
 * Utils
 */

function isBound (func) {
  return typeof func === 'function' && (!func.prototype || /^bound\b/.test(func.name))
}
