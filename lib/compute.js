'use strict'

const {patchAt, putAt} = require('emerge')

const {is, bind, apply, foldl, isArray, validate, isFunction, validateEach} = require('./lang')

const {readAll} = require('./compare')

/**
 * Public
 */

// Usage:
//   compute(['myCollection'], [['one'], ['other']], formula)
exports.compute = bind(computeBase, putAt)

exports.computePatch = bind(computeBase, patchAt)
exports.computeNonStrict = exports.computePatch  // BC alias

// Backwards compatibility.
exports.readAll = readAll

/**
 * Utils
 */

function computeBase (merge, path, sources, formula) {
  validate(isFunction, formula)
  validate(isArray, path)
  validateEach(isValidSource, sources)

  return (prev, next) => ifChanged(
    readAll(sources, prev),
    readAll(sources, next),
    formula,
    bind(merge, path, next),
    next
  )
}

function ifChanged (left, right, formula, out, def) {
  return !shallowEqual(left, right) ? out(apply(formula, right)) : def
}

function shallowEqual (left, right) {
  return foldl(eq, left, right)
}

function eq (acc, value, index) {
  return acc && is(value, acc[index]) ? acc : null
}

function isValidSource (value) {
  return isArray(value) || isFunction(value)
}
