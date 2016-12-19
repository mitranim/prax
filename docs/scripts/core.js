const {global, Atom, defonce,
       putIn, bind, seq, flat, id} = require('prax')
const {merge} = require('./utils')

const features = [
  require('./mock-feature')
]

const extract = key => flat(features.map(x => x[key]).filter(id))

/**
 * Env
 */

export const env = defonce(global, ['dev', 'env'], Atom)

env.watchers = extract('watchers')

env.effects = extract('effects')

env.send = bind(env.enque, function runEffects (msg) {
  env.effects.forEach(function runEffect (fun) {
    fun(env, msg)
  })
})

// /**
//  * Computers
//  */

// const {joinComputers} = require('prax')

// const computer = joinComputers(env.computers = extract('computers'))

// env.swap = (mod, ...args) => {
//   Atom.prototype.swap.call(env, prev => computer(prev, mod(prev, ...args)))
// }

/**
 * Init
 */

export function init () {
  env.state = merge(...extract('state'), env.state)
  env.notifyWatchers(env.state, env.state)
  return seq(...extract('init').map(fun => fun(env)))
}

/**
 * Dev
 */

window.dev = {...window.dev, env,
  set (...path) {
    env.swap(putIn, path, path.pop())
  }
}

if (window.devMode) Object.assign(window, window.dev)
