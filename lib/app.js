'use strict'

/* eslint-disable one-var, indent, block-spacing */

const replaceAt = require('emerge').replaceAt

const lang = require('./lang')
const is = lang.is
const or = lang.or
const not = lang.not
const seq = lang.seq
const bind = lang.bind
const flat = lang.flat
const pipe = lang.pipe
const apply = lang.apply
const foldl = lang.foldl
const ifelse = lang.ifelse
const remove = lang.remove
const resolve = lang.resolve
const isArray = lang.isArray
const isPromise = lang.isPromise
const isFunction = lang.isFunction
const isPrimitive = lang.isPrimitive
const validateEach = lang.validateEach
const isPlainObject = lang.isPlainObject

const Que = require('./que').Que

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
  let mean = replaceAt([], prev, initState)

  // Ensures sequential event ticks

  const que = Que()

  const enque = seq(safety, que.push)

  function safety (event) {
    if (phase === DATA) {
      throw Error(`Unexpected event ${stringify(event)} during data phase`)
    }
  }

  // App (proactive) -> Components (reactive)

  function main (event) {
    phase = DATA
    const next = calcState(reducers, computers, mean, event)

    phase = UPDATE
    prev = mean
    mean = next

    phase = EFFECTS
    enqueAny(enque, invoke(effects, prev, mean, event))
  }

  // World (proactive) -> App (reactive)

  function tick (event) {
    try {main(event)} finally {phase = IDLE}
  }

  que.setConsumer(tick)

  function getPrev () {return prev}

  function getMean () {return mean}

  function addEffect (func) {
    effects = effects.concat(func)
    return () => {effects = remove(func, effects)}
  }

  return {enque, getPrev, getMean, addEffect}
}

exports.EmitMono = EmitMono
function EmitMono (enque) {
  return func => pipe(func, enque)
}

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

function reduce (event, state, func) {
  return replaceAt([], state, func(state, event))
}

function compute (prev, next, func) {
  return replaceAt([], next, func(prev, next))
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

function invoke (funcs, a, b, c) {
  const out = []
  for (let i = -1; ++i < funcs.length;) {
    const result = funcs[i](a, b, c)
    if (result) out.push(result)
  }
  return out
}

function enqueAny (enque, value) {
  enqueMany(enque, flat([value]).filter(Boolean))
}

function enqueMany (enque, values) {
  enquePromises(enque, values.filter(isPromise))
  apply(enque, values.filter(isInert))
}

function enquePromises (enque, values) {
  values.forEach(bind(enquePromise, bind(enqueAny, enque)))
}

function enquePromise (enque, value) {
  value.then(enque)
}
