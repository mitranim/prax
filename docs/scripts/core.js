const {global, Atom, defonce, joinReducers, joinComputers,
  getIn, putIn, seq, flat, isFunction} = require('prax')
const {merge} = require('./utils')

/**
 * Env
 */

export const env = defonce(global, ['dev', 'env'], Atom)

env.send = function send (msg) {
  env.swap(calc, msg)
  env.enque(runEffects, msg)
}

function calc (prev, msg) {
  return joinComputers(env.computers)(prev, joinReducers(env.reducers)(prev, msg))
}

function runEffects (msg) {
  env.effects.forEach(function runEffect (fun) {
    fun(env, msg)
  })
}

/**
 * Init
 */

const extract = (features, key) => flat(features.map(x => x[key]).filter(Boolean))

export function init (env, features) {
  // Pure functions that create new state in response to events
  env.reducers = extract(features, 'reducers')

  // Pure functions that redefine app state as ƒ of itself.
  env.computers = extract(features, 'computers')

  // Side-effectful functions that react to events
  env.effects = extract(features, 'effects')

  // Side-effectful functions that react to data changes
  env.watchers = extract(features, 'watchers')

  // Initial state
  env.state = merge(...extract(features, 'state'), env.state)

  return seq(...extract(features, 'init').map(fun => fun(env)).filter(isFunction))
}

/**
 * Dev
 */

window.dev = {...window.dev, env,
  read () {
    return getIn(env.state, arguments)
  },
  set (...path) {
    env.swap(putIn, path, path.pop())
  }
}

if (window.devMode) Object.assign(window, window.dev)
