'use strict'

const {forEach} = Array.prototype

const {bind, pipe, comp, apply, defer, ifelse, cond, flat, isArray,
       isFunction, isPromise} = require('fpx')

const {AppCore, send, addSub, kill} = require('./app-core')

const {pass} = require('./words')

const flatList = ifelse(isArray, flat, () => [])

/**
 * App
 */

exports.App = App
function App (mods, comps, subs, state) {
  const core = AppCore(state, flatList(mods), flatList(comps), flatList(subs).map(effect))

  const app = {
    core,
    enque: explode(bind(send, core)),
    getPrev: () => core.prev,
    getMean: () => core.mean,
    addEffect: pipe(effect, bind(addSub, core)),
    die: bind(kill, core)
  }

  function effect (fun) {
    return function (prev, mean, msg, core) {
      sendAny(core, fun(prev, mean, msg, app))
    }
  }

  return app
}

exports.EmitMono = defer(comp)

exports.Emit = Emit
function Emit (enque) {
  return function emit (value) {
    return function () {
      enque(resolve(value, arguments))
    }
  }
}

/**
 * Utils
 */

function resolve (value, args) {
  return isFunction(value) ? resolve(apply(value, args), args) : value
}

function explode (fun) {
  return function () {
    forEach.call(arguments, fun)
  }
}

const second = bind(pipe, pass)

const sendAny = cond(
  second(isPromise), sendPromise,
  second(isArray),   sendList,
  second(Boolean),   send
)

function sendPromise (app, value) {
  value.then(bind(sendAny, app))
}

function sendList (app, values) {
  flat(values).forEach(bind(sendAny, app))
}
