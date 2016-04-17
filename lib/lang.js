'use strict'

/* eslint-disable no-self-compare */

// Func

exports.call = call
function call (func) {
  arguments[0] = null  // this relies on strict mode
  return func.call.apply(func, arguments)
}

exports.apply = apply
function apply (func, args) {
  return func.apply(null, args)
}

exports.bind = bind
function bind (func) {
  arguments[0] = null  // this relies on strict mode
  return func.bind.apply(func, arguments)
}

const defer = exports.defer = bind(bind, bind)

exports.rest = rest
function rest (func) {
  return function () {
    return func(slice(arguments))
  }
}

exports.spread = defer(apply)

const pipe = exports.pipe = rest(function pipe (funcs) {
  return function () {
    return foldl(collectPipe, arguments, funcs)
  }
})

function collectPipe (value, func, index) {
  return !index ? apply(func, value) : func(value)
}

exports.seq = rest(function seq (funcs) {
  return function () {
    return foldlWith(collectSeq, undefined, funcs, arguments)
  }
})

function collectSeq (_, func, __, args) {
  return apply(func, args)
}

exports.and = rest(function and (funcs) {
  return function () {
    return foldlWith(collectAnd, undefined, funcs, arguments)
  }
})

function collectAnd (acc, func, index, args) {
  return (!index || acc) && apply(func, args)
}

const or = exports.or = rest(function or (funcs) {
  return function () {
    return foldlWith(collectOr, undefined, funcs, arguments)
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

function shiftArgs (func) {
  return function () {
    return func.call.apply(func, arguments)
  }
}

// List

const slice = exports.slice = shiftArgs(Array.prototype.slice)

exports.concat = shiftArgs(Array.prototype.concat)

exports.foldl = foldl
function foldl (func, acc, list) {
  for (let i = -1; ++i < list.length;) acc = func(acc, list[i], i)
  return acc
}

exports.foldr = foldr
function foldr (func, acc, list) {
  for (let i = list.length; --i >= 0;) acc = func(acc, list[i], i)
  return acc
}

exports.foldlWith = foldlWith
function foldlWith (func, acc, list, a, b) {
  for (let i = -1; ++i < list.length;) acc = func(acc, list[i], i, a, b)
  return acc
}

exports.map = map
function map (func, list) {
  const out = []
  for (let i = -1; ++i < list.length;) out.push(func(list[i], i))
  return out
}

exports.indexOf = indexOf
function indexOf (value, list) {
  for (let i = -1; ++i < list.length;) if (is(list[i], value)) return i
  return -1
}

// Shows why operators is a dumb idea: ~ should have been a function.
const includes = exports.includes = pipe(indexOf, x => ~x, Boolean)

exports.remove = remove
function remove (value, list) {
  return removeAtIndex(indexOf(value, list), list)
}

function removeAtIndex (index, list) {
  return !~index ? list : slice(list, 0, index).concat(slice(list, index + 1))
}

exports.last = last
function last (list) {
  return list && list.length ? list[list.length - 1] : undefined
}

const flat = exports.flat = bind(foldl, concatFlat, [])

function concatFlat (list, value) {
  return list.concat(isArray(value) ? flat(value) : value)
}

exports.someWith = someWith
function someWith (test, list, a, b) {
  for (let i = -1; ++i < list.length;) if (test(list[i], i, a, b)) return true
  return false
}

// Object

exports.readKey = readKey
function readKey (key, value) {
  return isObject(value) ? value[key] : undefined
}

exports.mapObject = mapObject
function mapObject (func, value) {
  return Object.keys(value).map(key => func(value[key], key))
}

exports.mapValues = mapValues
function mapValues (func, value) {
  const out = {}
  for (const key in value) out[key] = func(value[key], key)
  return out
}

exports.mapKeys = mapKeys
function mapKeys (func, value) {
  const out = {}
  for (const key in value) out[func(value[key], key)] = value[key]
  return out
}

// Bool

exports.f = oneOf(undefined, null, false, NaN)

exports.t = not(exports.f)

function oneOf () {
  return value => includes(value, arguments)
}

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

// TODO consider deprecating.
exports.resolve = resolve
function resolve (value, args) {
  return isFunction(value) ? resolve(apply(value, args), args) : value
}

exports.it = it
function it (value) {
  return value
}
