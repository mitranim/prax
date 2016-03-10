'use strict'

/* eslint-disable no-unused-vars, no-self-compare */

// List

const slice = exports.slice = shiftArgs(Array.prototype.slice)
const concat = exports.concat = shiftArgs(Array.prototype.concat)

// Alternative to Array#reduce that always starts with the accumulator.
exports.foldl = foldl
function foldl (list, func, acc) {
  for (let i = -1; ++i < list.length;) acc = func(acc, list[i], i)
  return acc
}

exports.foldlWith = foldlWith
function foldlWith (values, func, acc, a, b) {
  for (let i = -1; ++i < values.length;) acc = func(acc, values[i], i, a, b)
  return acc
}

// Alternative to Array#reduceRight that always starts with the accumulator.
exports.foldr = foldr
function foldr (list, func, acc) {
  for (let i = list.length; --i >= 0;) acc = func(acc, list[i], i)
  return acc
}

// Non-broken alternative to Array#indexOf (SameValueZero instead of ===).
exports.indexOf = indexOf
function indexOf (list, value) {
  for (let i = -1; ++i < list.length;) if (is(list[i], value)) return i
  return -1
}

exports.remove = remove
function remove (list, value) {
  return removeAtIndex(list, indexOf(list, value))
}

function removeAtIndex (list, index) {
  return !~index ? list : slice(list, 0, index).concat(slice(list, index + 1))
}

exports.last = last
function last (list) {
  return isArray(list) ? list[list.length - 1] : undefined
}

exports.flat = flat
function flat (list) {
  return foldl(list, concatFlat, [])
}

function concatFlat (list, value) {
  return list.concat(isArray(value) ? flat(value) : value)
}

exports.someWith = someWith
function someWith (list, func, a, b) {
  for (let i = -1; ++i < list.length;) if (func(list[i], i, a, b)) return true
  return false
}

// Object

exports.readKey = readKey
function readKey (value, key) {
  return isObject(value) ? value[key] : undefined
}

exports.mapObject = mapObject
function mapObject (value, func) {
  return Object.keys(value).map(key => func(value[key], key))
}

exports.mapValues = mapValues
function mapValues (value, func) {
  const buffer = {}
  for (const key in value) buffer[key] = func(value[key], key)
  return buffer
}

exports.mapKeys = mapKeys
function mapKeys (value, func) {
  const buffer = {}
  for (const key in value) buffer[func(value[key], key)] = value[key]
  return buffer
}

// Func

exports.apply = apply
function apply (func, args) {
  return func.apply(null, args)
}

exports.bind = bind
function bind (func) {
  return func.bind.apply(func, arguments)
}

const pipe = exports.pipe = rest(function pipe (funcs) {
  return function () {
    return foldl(funcs, collectPipe, arguments)
  }
})

function collectPipe (value, func, index) {
  return !index ? apply(func, value) : func(value)
}

function shiftArgs (func) {
  return function () {
    return func.call.apply(func, arguments)
  }
}

function rest (func) {
  return function () {
    return func(arguments)
  }
}

exports.curry = curry
function curry (func) {
  return function () {
    return applyCurried(func, arguments)
  }
}

function applyCurried (func, args) {
  return args.length >= func.length
    ? apply(func, args)
    : applyPartial(func, args)
}

// TODO attempt to avoid allocating arrays for each call.
function applyPartial (func, args) {
  return function () {
    return applyCurried(func, slice(args).concat(slice(arguments)))
  }
}

exports.spreadDeep = spreadDeep
function spreadDeep (func) {
  return function () {
    return apply(func, flat(arguments))
  }
}

// Conditions

const and = exports.and = rest(function and (funcs) {
  return function () {
    return foldlWith(funcs, collectAnd, undefined, arguments)
  }
})

function collectAnd (acc, func, index, args) {
  return (!index || acc) && apply(func, args)
}

const or = exports.or = rest(function or (funcs) {
  return function () {
    return foldlWith(funcs, collectOr, undefined, arguments)
  }
})

function collectOr (acc, func, _, args) {
  return acc || apply(func, args)
}

exports.not = not
function not (func) {
  return function () {
    return !apply(func, arguments)
  }
}

exports.ifelse = ifelse
function ifelse (test, left, right) {
  return function () {
    return apply(apply(test, arguments) ? left : right, arguments)
  }
}

exports.ifthen = ifthen
function ifthen (test, func) {
  return ifelse(test, func, () => undefined)
}

// Bool

exports.is = is
function is (one, other) {
  return one === other || one !== one && other !== other
}

exports.isPlainObject = isPlainObject
function isPlainObject (value) {
  return isObject(value) && (value.constructor === Object || !('constructor' in value))
}

exports.isObject = isObject
function isObject (value) {
  return value != null && typeof value === 'object'
}

exports.isArray = isArray
function isArray (value) {
  return value instanceof Array
}

exports.isRegExp = isRegExp
function isRegExp (value) {
  return value instanceof RegExp
}

exports.isFunction = isFunction
function isFunction (value) {
  return typeof value === 'function'
}

exports.isPrimitive = not(or(isObject, isFunction))

exports.isPromise = isPromise
function isPromise (value) {
  return value != null && isFunction(value.then) && isFunction(value.catch)
}

// Misc

exports.resolve = resolve
function resolve (value, args) {
  return isFunction(value) ? resolve(apply(value, args), args) : value
}

exports.it = exports.id = it
function it (value) {
  return value
}

// Void

exports.callEach = callEach
function callEach (funcs, left, right) {
  for (let i = -1; ++i < funcs.length;) funcs[i](left, right)
}

const seq = exports.seq = rest(function seq (funcs) {
  return function () {
    return foldlWith(funcs, collectSeq, undefined, arguments)
  }
})

function collectSeq (_, func, __, args) {
  return apply(func, args)
}
