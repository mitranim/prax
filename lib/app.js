'use strict'

const {bind, pipe, ifelse, cond, foldl, flat, append, remove,
       isArray, isFunction, isPromise, validate} = require('fpx')
const {put, is} = require('emerge')

const {pass, cursorsChanged} = require('../words')

const flatList = ifelse(isArray, flat, () => [])

/**
 * App
 */

exports.App = App
function App (que, reducers, computers, effects) {
  return bindTo({
    que,
    prev: undefined,
    mean: undefined,
    reducers: flatList(reducers),
    computers: flatList(computers),
    effects: flatList(effects),
    views: [],
    enque: que.enque
  }, {
    main,
    addEffect,
    addView
  })
}

// Intended for HMR transitions.
// Resets known behaviours, keeping the rest of the state unchanged.
exports.migrateApp = migrateApp
function migrateApp (app, reducers, computers, effects) {
  app.reducers = flatList(reducers)
  app.computers = flatList(computers)
  app.effects = flatList(effects)
  app.views = []
  return app
}

/**
 * Methods
 */

function main (app, event) {
  // Data phase
  const prev = app.mean
  const mean = calc(app.reducers, app.computers, prev, event)

  // Commit
  app.prev = prev
  app.mean = mean

  // Effects phase
  app.effects.forEach(effect => {
    enqueAny(app.enque, effect(prev, mean, event, app))
  })

  // Render phase
  app.views.forEach(view => {
    if (view.paths && cursorsChanged(view.paths, prev, mean)) view.update()
  })
}

function addEffect (app, fun) {
  validate(isFunction, fun)
  app.effects = append(app.effects, fun)
  return () => {app.effects = remove(app.effects, fun)}
}

function addView (app, view) {
  app.views = append(app.views, view)
  return () => {app.views = remove(app.views, view)}
}

/**
 * Utils
 */

function calc (reducers, computers, prev, event) {
  const next0 = foldl(bind(reduce, event), prev, reducers)
  const next1 = foldlConverge(bind(compute, prev), next0, computers)
  return next1
}

function reduce (event, state, reducer) {
  return put(state, reducer(state, event))
}

function compute (prev, next, computer) {
  return put(next, computer(prev, next))
}

function foldlConverge (fun, prev, list) {
  const next = foldl(fun, prev, list)
  return is(prev, next)
    ? next
    : foldlConverge(fun, next, list)
}

const second = bind(pipe, pass)

const enqueAny = cond(
  second(isPromise), enquePromise,
  second(isArray),   enqueList,
  second(Boolean),   enqueOne
)

function enquePromise (enque, value) {
  value.then(bind(enqueAny, enque))
}

function enqueList (enque, values) {
  flat(values).forEach(bind(enqueAny, enque))
}

function enqueOne (enque, value) {
  enque(value)
}

function bindTo (ref, methods) {
  for (const key in methods) ref[key] = bind(methods[key], ref)
  return ref
}
