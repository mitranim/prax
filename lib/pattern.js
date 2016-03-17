'use strict'

const lang = require('./lang')
const is = lang.is
const and = lang.and
const bind = lang.bind
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
    ? bind(is, pattern)
    : isRegExp(pattern)
    ? pattern.test.bind(pattern)
    : objectTest(pattern)
}

function objectTest (pattern) {
  return and(isObject, apply(and, mapObject(keyTest, pattern)))
}

function keyTest (pattern, key) {
  return isFunction(pattern)
    ? value => pattern(value[key])
    : keyTest(toTest(pattern), key)
}
