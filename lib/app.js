'use strict'

const {bind, pipe, ifelse, cond, foldl, flat, append, remove,
       isArray, isFunction, isPromise, validate} = require('fpx')
const {copy, put, is} = require('emerge')

const {pass} = require('../words')

const flatList = ifelse(isArray, flat, () => [])

/**
 * App
 */

exports.App = App
function App (que, state, reducers, computers, effects) {
  return bindTo({
    que,
    prev: undefined,
    mean: copy(state),
    reducers: flatList(reducers),
    computers: flatList(computers),
    effects: flatList(effects)
  }, {
    main,
    addEffect
  })
}

/**
 * Methods
 */

function main (app, event) {
  // Data phase
  const prev = app.mean
  const mean = calc(prev, event, app.reducers, app.computers)

  // Commit
  app.prev = prev
  app.mean = mean

  // Effect phase
  app.effects.forEach(effect => {
    enqueAny(app.que.enque, effect(prev, mean, event, app.que.enque))
  })
}

function addEffect (app, fun) {
  validate(isFunction, fun)
  app.effects = append(app.effects, fun)
  return () => {app.effects = remove(app.effects, fun)}
}

/**
 * Utils
 */

function calc (prev, event, reducers, computers) {
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
  for (const key in methods) ref[key] = methods[key].bind(undefined, ref)
  return ref
}
