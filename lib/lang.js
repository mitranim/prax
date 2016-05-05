'use strict'

/* eslint-disable no-self-compare, no-sequences */

// Func

exports.call = call
function call (func) {
  validate(isFunction, func)
  arguments[0] = null  // this relies on strict mode
  return func.call.apply(func, arguments)
}

exports.apply = apply
function apply (func, args) {
  validate(isFunction, func)
  return func.apply(null, args)
}

exports.bind = bind
function bind (func) {
  validate(isFunction, func)
  arguments[0] = null  // this relies on strict mode
  return func.bind.apply(func, arguments)
}

exports.flip = flip
function flip (func) {
  validate(isFunction, func)
  return function () {
    return apply(func, slice(arguments).reverse())
  }
}

const pipe = exports.pipe = rest(function pipe (funcs) {
  validateEach(isFunction, funcs)
  return function () {
    return foldl(collectPipe, arguments, funcs)
  }
})

function collectPipe (value, func, index) {
  return !index ? apply(func, value) : func(value)
}

exports.comp = flip(pipe)

const seq = exports.seq = rest(function seq (funcs) {
  validateEach(isFunction, funcs)
  return function () {
    return foldlWith(collectSeq, undefined, funcs, arguments)
  }
})

function collectSeq (_, func, __, args) {
  return apply(func, args)
}

exports.and = rest(function and (funcs) {
  validateEach(isFunction, funcs)
  return function () {
    return foldlWith(collectAnd, undefined, funcs, arguments)
  }
})

function collectAnd (acc, func, index, args) {
  return (!index || acc) && apply(func, args)
}

const or = exports.or = rest(function or (funcs) {
  validateEach(isFunction, funcs)
  return function () {
    return foldlWith(collectOr, undefined, funcs, arguments)
  }
})

function collectOr (acc, func, _, args) {
  return acc || apply(func, args)
}

exports.not = not
function not (func) {
  validate(isFunction, func)
  return function () {
    return !apply(func, arguments)
  }
}

exports.ifelse = ifelse
function ifelse (test, left, right) {
  validateEach(isFunction, arguments)
  return function () {
    return apply(apply(test, arguments) ? left : right, arguments)
  }
}

exports.ifthen = ifthen
function ifthen (test, func) {
  return ifelse(test, func, () => undefined)
}

const _defer = bind(bind, bind)

exports.defer = defer
function defer (func) {
  validate(isFunction, func)
  return apply(_defer, arguments)
}

exports.rest = rest
function rest (func) {
  validate(isFunction, func)
  return function () {
    return func(slice(arguments))
  }
}

const _spread = defer(apply)

exports.spread = spread
function spread (func) {
  validate(isFunction, func)
  return apply(_spread, arguments)
}

// List

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
function indexOf (list, value) {
  for (let i = -1; ++i < list.length;) if (is(list[i], value)) return i
  return -1
}

exports.includes = includes
function includes (list, value) {
  return !!~indexOf(list, value)
}

const _slice = Array.prototype.slice

exports.slice = slice
function slice () {
  return _slice.call.apply(_slice, arguments)
}

exports.append = append
function append (list, value) {
  validate(isArray, list)
  return list.concat([value])
}

exports.prepend = prepend
function prepend (list, value) {
  validate(isArray, list)
  return [value].concat(list)
}

exports.remove = remove
function remove (list, value) {
  const index = indexOf(list, value)
  return ~index ? removeAt(list, index) : list
}

function removeAt (list, index) {
  return list = slice(list), list.splice(index, 1), list
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

const oneOf = rest(defer(includes))

exports.f = oneOf(undefined, null, false, NaN)

exports.t = not(exports.f)

exports.is = is
function is (one, other) {
  return one === other || one !== one && other !== other
}

exports.isNumber = isNumber
function isNumber (value) {
  return typeof value === 'number'
}

exports.isString = isString
function isString (value) {
  return typeof value === 'string'
}

exports.isBoolean = isBoolean
function isBoolean (value) {
  return typeof value === 'boolean'
}

exports.isSymbol = isSymbol
function isSymbol (value) {
  return typeof value === 'symbol'
}

exports.isFunction = isFunction
function isFunction (value) {
  return typeof value === 'function'
}

exports.isObject = isObject
function isObject (value) {
  return value != null && typeof value === 'object'
}

exports.isPlainObject = isPlainObject
function isPlainObject (value) {
  return isObject(value) && (value.constructor === Object || !('constructor' in value))
}

exports.isArray = isArray
function isArray (value) {
  return value instanceof Array
}

exports.isRegExp = isRegExp
function isRegExp (value) {
  return value instanceof RegExp
}

exports.isPromise = isPromise
function isPromise (value) {
  return value != null && isFunction(value.then) && isFunction(value.catch)
}

exports.isPrimitive = not(or(isObject, isFunction))

exports.isNil = isNil
function isNil (value) {
  return value == null
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

exports.val = defer(it)

exports.validate = validate
function validate (test, value) {
  if (!test(value)) throw Error(`Expected ${value} to satisfy test ${test.name}`)
}

exports.validateEach = validateEach
function validateEach (test, list) {
  for (let i = -1; ++i < list.length;) {
    if (!test(list[i])) {
      throw Error(`Expected ${list[i]} at index ${i} to satisfy test ${test.name}`)
    }
  }
}
