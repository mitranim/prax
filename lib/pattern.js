'use strict'

const lang = require('./lang')
const is = lang.is
const and = lang.and
const apply = lang.apply
const isObject = lang.isObject
const isRegExp = lang.isRegExp
const mapObject = lang.mapObject
const isFunction = lang.isFunction
const isPrimitive = lang.isPrimitive

exports.toTest = toTest
function toTest (pattern) {
  return isFunction(pattern)
    ? pattern
    : isPrimitive(pattern)
    ? value => is(pattern, value)
    : isRegExp(pattern)
    ? pattern.test.bind(pattern)
    : objectTest(pattern)
}

function objectTest (pattern) {
  return and(isObject, apply(and, mapObject(pattern, keyTest)))
}

function keyTest (pattern, key) {
  return isFunction(pattern)
    ? value => pattern(value[key])
    : keyTest(toTest(pattern), key)
}
