'use strict'

/* eslint-disable no-unused-vars, no-self-compare */

// List

const slice = exports.slice = shiftArgs(Array.prototype.slice)

const foldl = exports.foldl = shiftArgs(Array.prototype.reduce)

const indexOf = exports.indexOf = shiftArgs(Array.prototype.indexOf)

const concat = exports.concat = shiftArgs(Array.prototype.concat)

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

// Object

exports.readKey = readKey
function readKey (value, key) {
  return isObject(value) ? value[key] : undefined
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
    return foldl(funcs, collect, arguments)
  }
})

function collect (value, func, index) {
  return index ? func(value) : apply(func, value)
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

function applyPartial (func, args) {
  return function () {
    return applyCurried(func, slice(args).concat(slice(arguments)))
  }
}

// Bool

const and = exports.and = rest(function and (funcs) {
  return function () {
    return foldl(funcs, (acc, func, index) => (
      (!index || acc) && apply(func, arguments)
    ), undefined)
  }
})

const or = exports.or = rest(function or (funcs) {
  return function () {
    return foldl(funcs, (acc, func) => (
      acc || apply(func, arguments)
    ), undefined)
  }
})

exports.not = not
function not (func) {
  return function () {
    return !apply(func, arguments)
  }
}

exports.ifelse = ifelse
function ifelse (cond, left, right) {
  return function () {
    return apply(apply(cond, arguments) ? left : right, arguments)
  }
}

exports.resolve = resolve
function resolve (value, args) {
  return isFunction(value) ? resolve(apply(value, args), args) : value
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

// Iter

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

exports.callEach = callEach
function callEach (funcs, left, right) {
  for (let i = -1; ++i < funcs.length;) funcs[i](left, right)
}

const seq = exports.seq = rest(function seq (funcs) {
  return function () {
    for (let i = -1; ++i < funcs.length;) apply(funcs[i], arguments)
  }
})
