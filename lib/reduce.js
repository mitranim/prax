'use strict'

const emerge = require('emerge')
const readAt = emerge.readAt
const mergeAt = emerge.mergeAt
const replaceAt = emerge.replaceAt

const toTest = require('./pattern').toTest

const lang = require('./lang')
const it = lang.it
const bind = lang.bind
const flat = lang.flat
const pipe = lang.pipe
const slice = lang.slice
const ifelse = lang.ifelse
const readKey = lang.readKey
const isObject = lang.isObject

exports.st = st
function st (type, value) {
  return {type, value}
}

exports.std = std
function std (type, key, value) {
  return {type, key, value}
}

exports.match = match
function match (pattern, func) {
  return _match(toTest(pattern), func)
}

function _match (test, func) {
  return ifelse(pipe(pass, test), func, it)
}

exports.on = on
function on (type, func) {
  return match({type}, (state, event) => func(state, event.value))
}

exports.one = one
function one (type, func) {
  return match({type, key: exists}, (state, event) => mergeAt(
    [event.key],
    state,
    func(readKey(event.key, state), event.value, event.key)
  ))
}

function exists (value) {
  return !!value || value === 0
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
