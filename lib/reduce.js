'use strict'

const {readAt, patchAt, putAt} = require('emerge')

const {test} = require('./pattern')

const {t, it, bind, flat, pipe, defer, slice, ifelse, readKey, isObject,
       validate, isFunction} = require('./lang')

exports.st = st
function st (type, value) {
  return {type, value}
}

exports.stk = stk
function stk (type, key, value) {
  return {type, key, value}
}

// Backwards compatibility, TODO remove.
exports.std = stk

// WTB better names.
exports.stf = defer(st)
exports.stkf = defer(stk)

exports.match = match
function match (pattern, func) {
  return ifonly(pipe(pass, test(pattern)), func)
}

exports.on = on
function on (type, func) {
  validate(isFunction, func)
  return match({type}, (state, event) => func(state, event.value, event.key))
}

exports.one = one
function one (type, func) {
  validate(isFunction, func)
  return match({type, key: t}, (state, event) => patchAt(
    [event.key],
    state,
    func(readKey(event.key, state), event.value, event.key)
  ))
}

exports.manage = manage
function manage (path) {
  return flat(slice(arguments, 1)).map(bind(manageOne, path, putAt))
}

exports.manageNonStrict = managePatch  // BC alias
exports.managePatch = managePatch
function managePatch (path) {
  return flat(slice(arguments, 1)).map(bind(manageOne, path, patchAt))
}

function manageOne (path, merge, func) {
  return (state, event) => (
    merge(path, state, func(readAt(path, state), event))
  )
}

exports.pass = pass
function pass (_, x) {
  return x
}

exports.upgrade = bind(pipe, merge)

function merge (left, right) {
  return isObject(right) ? patchAt([], left, right) : left
}

exports.ifonly = ifonly
function ifonly (test, func) {
  return ifelse(test, func, it)
}
