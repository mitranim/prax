'use strict'

/* eslint-disable one-var, indent */

const {putAt} = require('emerge')

const {is, or, not, bind, comp, flat, apply, defer, foldl, append, ifelse,
       remove, isArray, validate, isPromise, isFunction, isPrimitive,
       validateEach, isPlainObject} = require('fpx')

const {Que} = require('./que')

const flatList = ifelse(isArray, flat, () => [])

const serialisable = or(isPrimitive, isPlainObject, isArray)

const stringify = ifelse(serialisable, JSON.stringify, String)

const isInert = not(isPromise)

/**
 * Public
 */

const
IDLE = 0,
DATA = 1,
UPDATE = 2,
EFFECTS = 3

exports.App = App
function App (reducers, computers, effects, initState) {
  reducers = flatList(reducers)
  computers = flatList(computers)
  effects = flatList(effects)

  validateEach(isFunction, reducers)
  validateEach(isFunction, computers)
  validateEach(isFunction, effects)

  let phase = IDLE
  let prev
  let mean = putAt([], prev, initState)

  // Ensures linearity of "main loop" ticks
  const que = Que()

  que.setConsumer(function tick (event) {
    try {main(event)} finally {phase = IDLE}
  })

  function main (event) {
    phase = DATA
    const next = calcState(reducers, computers, mean, event)

    phase = UPDATE
    prev = mean
    mean = next

    phase = EFFECTS
    enqueAny(enque, invoke(effects, prev, mean, event))
  }

  function enque (event) {
    if (phase === DATA) {
      throw Error(`Unexpected event ${stringify(event)} during data phase`)
    }
    apply(que.push, arguments)
  }

  function getPrev () {return prev}

  function getMean () {return mean}

  function addEffect (fun) {
    validate(isFunction, fun)
    effects = append(effects, fun)
    return () => {effects = remove(effects, fun)}
  }

  function die () {
    que.die()
  }

  return {enque, getPrev, getMean, addEffect, die}
}

exports.EmitMono = defer(comp)

// TODO deprecate in favour of monomorphic emit.
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

function reduce (event, state, fun) {
  return putAt([], state, fun(state, event))
}

function compute (prev, next, fun) {
  return putAt([], next, fun(prev, next))
}

// TODO rewrite without a variable.
function recompute (prev, next, computers) {
  const next1 = foldl(bind(compute, prev), next, computers)
  return is(next, next1)
    ? next1
    : recompute(prev, next1, computers)
}

function calcState (reducers, computers, state, event) {
  const next1 = foldl(bind(reduce, event), state, reducers)
  const next2 = recompute(state, next1, computers)
  return next2
}

function invoke (funs, a, b, c, d) {
  const out = []
  for (let i = -1; ++i < funs.length;) {
    const result = funs[i](a, b, c, d)
    if (result) out.push(result)
  }
  return out
}

function enqueAny (enque, value) {
  enqueMany(enque, flat([value]).filter(Boolean))
}

function enqueMany (enque, values) {
  enquePromises(enque, values.filter(isPromise))
  enqueValues(enque, values.filter(isInert))
}

function enquePromises (enque, values) {
  values.forEach(bind(enquePromise, bind(enqueAny, enque)))
}

function enquePromise (enque, value) {
  value.then(enque)
}

function enqueValues (enque, values) {
  if (values.length) apply(enque, values)
}

function resolve (value, args) {
  return isFunction(value) ? resolve(apply(value, args), args) : value
}
