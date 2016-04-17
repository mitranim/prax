'use strict'

const emerge = require('emerge')
const readAt = emerge.readAt
const mergeAt = emerge.mergeAt
const replaceAt = emerge.replaceAt

const toTest = require('./pattern').toTest

const lang = require('./lang')
const t = lang.t
const it = lang.it
const bind = lang.bind
const flat = lang.flat
const pipe = lang.pipe
const defer = lang.defer
const slice = lang.slice
const ifelse = lang.ifelse
const readKey = lang.readKey
const isObject = lang.isObject
const validate = lang.validate
const isFunction = lang.isFunction

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
  return ifonly(pipe(pass, toTest(pattern)), func)
}

exports.on = on
function on (type, func) {
  validate(isFunction, func)
  return match({type}, (state, event) => func(state, event.value, event.key))
}

exports.one = one
function one (type, func) {
  validate(isFunction, func)
  return match({type, key: t}, (state, event) => mergeAt(
    [event.key],
    state,
    func(readKey(event.key, state), event.value, event.key)
  ))
}

exports.manage = manage
function manage (path) {
  return flat(slice(arguments, 1)).map(bind(manageOne, path, replaceAt))
}

exports.manageNonStrict = manageNonStrict
function manageNonStrict (path) {
  return flat(slice(arguments, 1)).map(bind(manageOne, path, mergeAt))
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

exports.upgrade = upgrade
function upgrade (func) {
  return pipe(merge, func)
}

function merge (left, right) {
  return isObject(right) ? mergeAt([], left, right) : left
}

exports.ifonly = ifonly
function ifonly (test, func) {
  return ifelse(test, func, it)
}

exports.True = True
function True () {
  return true
}

exports.False = False
function False () {
  return false
}

exports.Null = Null
function Null () {
  return null
}
