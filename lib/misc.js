'use strict'

const {PathQuery} = require('espo')
const {equal} = require('emerge')
const {ifonly, rest, test} = require('fpx')

exports.byPath = byPath
function byPath (observable, path) {
  return new PathQuery(observable, path, equal)
}

exports.on = on
function on (argPattern, fun) {
  return ifonly(rest(test(argPattern)), fun)
}
