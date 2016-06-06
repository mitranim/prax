'use strict'

const {is, and, val, bind, pipe, apply, prepend, readKey, isObject, isRegExp,
       mapObject, mapValues, isFunction, isPrimitive} = require('./lang')

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
  return apply(and, prepend(mapObject(keyTest, pattern), isObject))
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
