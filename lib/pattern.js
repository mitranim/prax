'use strict'

const lang = require('./lang')
const is = lang.is
const and = lang.and
const val = lang.val
const bind = lang.bind
const pipe = lang.pipe
const apply = lang.apply
const readKey = lang.readKey
const isObject = lang.isObject
const isRegExp = lang.isRegExp
const mapObject = lang.mapObject
const mapValues = lang.mapValues
const isFunction = lang.isFunction
const isPrimitive = lang.isPrimitive

exports.test = exports.toTest = test
function test (pattern) {
  return isFunction(pattern)
    ? pattern
    : isPrimitive(pattern)
    ? bind(is, pattern)
    : isRegExp(pattern)
    ? pattern.test.bind(pattern)
    : objectTest(pattern)
}

function objectTest (pattern) {
  return and(isObject, apply(and, mapObject(keyTest, pattern)))
}

function keyTest (pattern, key) {
  return pipe(bind(readKey, key), test(pattern))
}

exports.mask = mask
function mask (pattern) {
  return isFunction(pattern)
    ? pattern
    : isPrimitive(pattern)
    ? val(pattern)
    : isRegExp(pattern)
    ? pattern.test.bind(pattern)
    : objectMask(mapValues(mask, pattern))
}

function objectMask (pattern) {
  return pipe(Object, bind(applyMask, pattern))
}

function applyMask (pattern, object) {
  return mapValues((mask, key) => mask(object[key]), pattern)
}
