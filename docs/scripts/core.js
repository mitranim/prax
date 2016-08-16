const {putIn, Ref, defonce, seq, pipe, juxt, spread, flat, id} = require('prax')
const {merge, Ws} = require('./utils')

const features = [
  require('./mock-feature')
]

const extract = key => flat(features.map(x => x[key]).filter(id))

/**
 * Env
 */

export const env = defonce(['dev', 'env'], Ref)

env.ws = defonce(['dev', 'ws'], Ws, 'wss:///', env)

env.watches = {
  static: seq(...extract('watches'))
}

env.effects = extract('effects')

env.send = function send (msg) {
  env.enque(() => {
    env.effects.forEach(fun => {fun(env, msg)})
  })
}

// /**
//  * Bc
//  */

// const {joinComputers} = require('prax/bc')
// const {swap} = require('prax')

// const computer = joinComputers(env.computers = extract('computers'))

// env.swap = (mod, ...args) => {
//   swap(env, prev => computer(prev, mod(prev, ...args)))
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
