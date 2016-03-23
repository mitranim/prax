'use strict'

/* eslint-disable one-var, indent, block-spacing */

const replaceAt = require('emerge').replaceAt

const lang = require('./lang')
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
const isPrimitive = lang.isPrimitive
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

  let phase = IDLE
  let prev
  let mean = replaceAt([], prev, initState)

  // Sequential event handling

  const que = Que()

  const enque = seq(safety, que.push)

  function enqueMany (values) {
    values = flat(values).filter(Boolean)
    values.filter(isPromise).forEach(enquePromise)
    apply(enque, values.filter(isInert))
  }

  function enquePoly (value) {
    enqueMany([value])
  }

  function enquePromise (value) {
    value.then(enquePoly).catch(seq(enquePoly, rethrow))
  }

  // App (proactive) -> Components (reactive)

  function main (event) {
    phase = DATA
    const next = calcState(reducers, computers, mean, event)

    phase = UPDATE
    prev = mean
    mean = next

    phase = EFFECTS
    enqueMany(invoke(effects, prev, mean, event))
  }

  function safety (event) {
    if (phase === DATA) {
      throw Error(`Unexpected event ${stringify(event)} during data phase`)
    }
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
    return () => { effects = remove(func, effects) }
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

function compute (mean, next, func) {
  return replaceAt([], next, func(mean, next))
}

function calcState (reducers, computers, mean, event) {
  const next1 = foldl(bind(reduce, event), mean, reducers)
  const next2 = foldl(bind(compute, mean), next1, computers)
  return next2
}

function invoke (funcs, a, b, c) {
  const out = []
  for (let i = -1; ++i < funcs.length;) {
    const result = funcs[i](a, b, c)
    if (result != null) out.push(result)
  }
  return out
}

function rethrow (value) {
  throw value
}
