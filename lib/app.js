'use strict'

/* eslint-disable one-var, indent, block-spacing */

const replaceAt = require('emerge').replaceAt

const lang = require('./lang')
const seq = lang.seq
const flat = lang.flat
const foldl = lang.foldl
const apply = lang.apply
const remove = lang.remove
const resolve = lang.resolve
const isArray = lang.isArray
const isPromise = lang.isPromise
const isPrimitive = lang.isPrimitive
const isPlainObject = lang.isPlainObject

const reduce = require('./reduce')
const reduceIterator = reduce.reduceIterator
const computeIterator = reduce.computeIterator

const Que = require('./que').Que

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
    values = flat(values)
    values.filter(isPromise).forEach(enquePromise)
    apply(enque, values.filter(isInert))
  }

  function enquePoly (value) {
    enqueMany([value])
  }

  function enquePromise (value) {
    value.then(enquePoly)
  }

  // App (proactive) -> Components (reactive)

  function main (event) {
    phase = DATA
    const next = calcState(reducers, computers, mean, event)

    phase = UPDATE
    prev = mean
    mean = next

    phase = EFFECTS
    enqueMany(invoke(effects, prev, mean))
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
    return () => { effects = remove(effects, func) }
  }

  return {enque, getPrev, getMean, addEffect}
}

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

function calcState (reducers, computers, state, event) {
  const next1 = foldl(reducers, reduceIterator(event), state)
  const next2 = foldl(computers, computeIterator(state), next1)
  return next2
}

function flatList (value) {
  return isArray(value) ? flat(value) : []
}

function stringify (value) {
  return serialisable(value) ? JSON.stringify(value) : String(value)
}

function serialisable (value) {
  return isPrimitive(value) || isPlainObject(value) || isArray(value)
}

function invoke (funcs, a, b) {
  const buffer = []
  for (let i = -1; ++i < funcs.length;) {
    const result = funcs[i](a, b)
    if (result != null) buffer.push(result)
  }
  return buffer
}

function isInert (value) {
  return value && !isPromise(value)
}
