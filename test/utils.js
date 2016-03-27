'use strict'

/* eslint-disable no-self-compare, block-spacing */

const deepEqual = require('emerge').deepEqual

exports.test = test
function test (func) {
  for (const config of [].slice.call(arguments, 1)) {
    const args = toList(config)
    const result = func.apply(null, args)
    if (!deepEqual(result, config.out)) err(config.out, result, func, args)
  }
}

exports.eq = eq
function eq (a, b) {
  test(equal, {0: a, 1: b, out: true})
}

function equal (a, b) {
  return a === b || a !== a && b !== b
}

exports.deq = deq
function deq (a, b) {
  test(deepEqual, {0: a, 1: b, out: true})
}

exports.throws = throws
function throws () {
  for (const func of arguments) {
    let error
    try {func()} catch (err) {error = err}
    if (!error) throw Error(`Expected function ${func.name} to throw`)
  }
}

exports.ignore = ignore
function ignore (func) {
  try {func()} catch (_) {}
}

const codes = {
  blue: '\x1b[34m',
  red: '\x1b[31m',
  inverse: '\x1b[7m',
  reset: '\x1b[0m'
}

function toList (object) {
  return [].slice.call(Object.assign({}, object, {length: len(object)}))
}

function len (object) {
  return Math.max.apply(Math, indices(object)) + 1
}

function indices (object) {
  return Object.keys(object).map(Number).filter(x => !isNaN(x))
}

function err (expected, got, func, args) {
  throw Error(`Function:\n  ${blue(inspect(func))}\n` +
              `Arguments:\n  ${blue(inspect(args))}\n` +
              `Expected:\n  ${blue(inspect(expected))}\n` +
              `Got:\n  ${red(inspect(got))}`)
}

function blue (msg) {
  return `${codes.blue}${msg}${codes.reset}`
}

function red (msg) {
  return `${codes.red}${msg}${codes.reset}`
}

function inspect (value) {
  return require('util').inspect(value, {depth: null})
}
