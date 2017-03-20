'use strict'

const {bind, defer, pipe, ifonly, juxt, test, di, flat, map, foldl,
  filter, mapVals, isFunction, isDict} = require('fpx')
const {getAt, mergeBy} = require('emerge')
const pub = exports

pub.on = on
function on (pattern, fun) {
  return ifonly(pipe(di, test(pattern)), fun)
}

const from = defer(getAt)

pub.extract = extract
function extract (path, modules) {
  return flat(map(from(path), modules).filter(Boolean))
}

pub.fuseDicts = fuseDicts
function fuseDicts (values) {
  return foldl(fuse, {}, map(toDict, values))
}

const fuse = bind(mergeBy, flatConcat)

function flatConcat (left, right) {
  return flat([left, right]).filter(Boolean)
}

pub.fuseModules = fuseModules
function fuseModules (modules) {
  return mapVals(permissiveJuxt, fuseDicts(modules))
}

function permissiveJuxt (values) {
  return juxt(...filter(isFunction, values))
}

function toDict (value) {
  return isDict(value) ? value : {}
}
