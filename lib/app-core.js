'use strict'

/**
 * Experimental.
 */

const {put, copy} = require('emerge')

const {is, bind, apply, foldl, append, remove, slice,
       isArray, isFunction, validate, validateEach} = require('fpx')

/**
 * AppCore
 */

exports.AppCore = AppCore
function AppCore (state, mods, comps, subs) {
  if (mods) validateEach(isFunction, mods)
  if (comps) validateEach(isFunction, comps)
  if (subs) validateEach(isFunction, subs)

  return {
    prev: undefined,
    mean: copy(state),
    _idle: true,
    _dead: false,
    _pending: [],
    _mods: mods || [],
    _comps: comps || [],
    _subs: subs || []
  }
}

exports.send = send
function send (app, msg) {
  enqueMethod(app, bind(main, msg))
}

exports.addMod = bind(enroll, '_mods')
exports.addComp = bind(enroll, '_comps')
exports.addSub = bind(enroll, '_subs')

exports.kill = kill
function kill (app) {
  app._pending.splice(0)
  app._dead = true
}

/**
 * Plumbing
 */

function main (msg, app) {
  const prev = app.mean
  const mean = calc(prev, msg, app._mods, app._comps)
  app.prev = prev
  app.mean = mean
  _notify(app._subs, prev, mean, msg, app)
}

function calc (mean, msg, mods, comps) {
  const next0 = foldl(bind(reduce, msg), mean, mods)
  const next1 = recompute(mean, next0, comps)
  return next1
}

function reduce (msg, acc, mod) {
  return put(acc, mod(acc, msg))
}

function recompute (prev, next0, comps) {
  const next1 = foldl(bind(compute, prev), next0, comps)
  return is(next0, next1) ? next1 : recompute(prev, next1, comps)
}

function compute (prev, next, comp) {
  return put(next, comp(prev, next))
}

// Executes methods linearly, FIFO style.
exports.enqueMethod = enqueMethod
function enqueMethod (app, method) {
  validate(isFunction, method)
  validate(isArray, app._pending)

  if (app._dead) return
  app._pending.push(method)

  if (app._idle) {
    app._idle = false
    try {_flush(app)}
    finally {app._idle = true}
  }
}

function _flush (app) {
  if (app._pending.length) {
    try {app._pending.shift()(app)}
    finally {_flush(app)}
  }
}

function _notify (subs) {
  const args = slice(arguments, 1)
  subs.forEach(sub => {apply(sub, args)})
}

function enroll (key, app, fun) {
  validate(isFunction, fun)
  app[key] = append(app[key], fun)
  return bind(unenroll, key, app, fun)
}

function unenroll (key, app, fun) {
  app[key] = remove(app[key], fun)
}
