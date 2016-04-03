'use strict'

const emerge = require('emerge')
const mergeAt = emerge.mergeAt
const replaceAt = emerge.replaceAt

const lang = require('./lang')
const is = lang.is
const bind = lang.bind
const apply = lang.apply
const foldl = lang.foldl

const readAll = require('./compare').readAll

/**
 * Public
 */

// Usage:
//   compute(['myCollection'], [['one'], ['other']], formula)
exports.compute = bind(computeBase, replaceAt)

exports.computeNonStrict = bind(computeBase, mergeAt)

// Backwards compatibility.
exports.readAll = readAll

/**
 * Utils
 */

function computeBase (merge, path, sources, formula) {
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
