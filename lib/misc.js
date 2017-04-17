'use strict'

const {bind, pipe, ifonly, juxt, test, di, flat, map, foldl,
  filter, mapVals, isFunction, isDict} = require('fpx')
const {getAt, mergeBy} = require('emerge')

exports.on = on
function on (pattern, fun) {
  return ifonly(pipe(di, test(pattern)), fun)
}

exports.extract = extract
function extract (path, modules) {
  return flat(map(bind(getAt, path), modules).filter(Boolean))
}

exports.fuseDicts = fuseDicts
function fuseDicts (values) {
  return foldl(fuse, {}, map(toDict, values))
}

const fuse = bind(mergeBy, flatConcat)

function flatConcat (left, right) {
  return flat([left, right]).filter(Boolean)
}

exports.fuseModules = fuseModules
function fuseModules (modules) {
  return mapVals(permissiveJuxt, fuseDicts(modules))
}

function permissiveJuxt (values) {
  return juxt(...filter(isFunction, values))
}

function toDict (value) {
  return isDict(value) ? value : {}
}
