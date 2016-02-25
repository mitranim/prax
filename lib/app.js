'use strict'

/* eslint-disable one-var, indent, block-spacing */

/**
 * Dependencies
 */

const lang = require('./lang')
const seq = lang.seq
const flat = lang.flat
const foldl = lang.foldl
const remove = lang.remove
const resolve = lang.resolve
const isArray = lang.isArray
const callEach = lang.callEach
const isPrimitive = lang.isPrimitive
const isPlainObject = lang.isPlainObject

const reduce = require('./reduce')
const reduceIterator = reduce.reduceIterator
const computeIterator = reduce.computeIterator

const Enque = require('./enque').Enque

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
  let mean

  // App (proactive) -> Components (reactive)

  function main (event) {
    phase = DATA
    const next = calcState(reducers, computers, mean, event)

    phase = UPDATE
    prev = mean
    mean = next

    phase = EFFECTS
    callEach(effects, prev, mean)
  }

  function tick (event) {
    try {main(event)} finally {phase = IDLE}
  }

  function safety (event) {
    if (phase === DATA) {
      throw Error(`Unexpected event ${stringify(event)} during data phase`)
    }
  }

  // World (proactive) -> App (reactive)

  const enque = seq(safety, Enque(tick, setTimeout))

  function getPrev () {return prev}

  function getMean () {return mean}

  function addEffect (func) {
    effects = effects.concat(func)
    return () => { remove(effects, func) }
  }

  function init () {
    prev = mean
    mean = foldl(computers, computeIterator(prev), initState)
    callEach(effects, prev, mean)
  }

  return {enque, getPrev, getMean, addEffect, init}
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
