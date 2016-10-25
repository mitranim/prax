const {Atom, defonce,
       putIn, bind, seq, pipe, juxt, spread, flat, id} = require('prax')
const {merge} = require('./utils')

const features = [
  require('./mock-feature')
]

const extract = key => flat(features.map(x => x[key]).filter(id))

/**
 * Env
 */

export const env = defonce(['dev', 'env'], Atom)

env.watches = {
  static: seq(...extract('watches'))
}

env.effects = extract('effects')

env.send = bind(env.enque, function runEffects (env, msg) {
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
//   Atom.swap(env, prev => computer(prev, mod(prev, ...args)))
// }

/**
 * Init
 */

// Apply new default state, but prioritise built-up state.
env.swap(state => merge(state, ...extract('state'), state))

const init = pipe(juxt(...extract('init')), spread(seq))

const teardown = init(env)

if (module.hot) module.hot.dispose(teardown)

/**
 * Dev
 */

window.dev = {...window.dev, env,
  set (...path) {
    env.swap(putIn, path, path.pop())
  }
}

if (window.devMode) Object.assign(window, window.dev)
