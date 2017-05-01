'use strict'

const {PathQuery, Query, Computation} = require('espo')
const {equal} = require('emerge')
const {ifonly, rest, test, isList, validate} = require('fpx')

exports.byPath = byPath
function byPath (observableRef, path) {
  return new PathQuery(observableRef, path, equal)
}

exports.byQuery = byQuery
function byQuery (observableRef, query) {
  return new Query(observableRef, query, equal)
}

exports.computation = computation
function computation (def) {
  return new Computation(def, equal)
}

exports.on = on
function on (argPattern, fun) {
  validate(isList, argPattern)
  return ifonly(rest(test(argPattern)), fun)
}
