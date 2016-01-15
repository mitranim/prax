'use strict'

exports.toTest = toTest
function toTest (pattern) {
  if (typeof pattern === 'function') return pattern
  if (isReallyNaN(pattern)) return isReallyNaN
  if (!isObject(pattern)) return value => value === pattern
  if (pattern instanceof RegExp) return pattern.test.bind(pattern)
  return objectToTest(pattern)
}

/**
 * Utils
 */

function isObject (value) {
  return value !== null && typeof value === 'object'
}

function objectToTest (pattern) {
  const pairs = Object.keys(pattern).map(key => ({key, test: toTest(pattern[key])}))
  return value => (
    isObject(value) && pairs.every(pair => pair.test.call(null, value[pair.key]))
  )
}

function isReallyNaN (value) {
  return value !== value  // eslint-disable-line
}
