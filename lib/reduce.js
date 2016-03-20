'use strict'

const emerge = require('emerge')
const mergeAt = emerge.mergeAt
const replaceAt = emerge.replaceAt
const readAt = emerge.readAt

const toTest = require('./pattern').toTest

const lang = require('./lang')
const bind = lang.bind
const flat = lang.flat
const pipe = lang.pipe
const slice = lang.slice
const mapKeys = lang.mapKeys
const readKey = lang.readKey
const isArray = lang.isArray
const isObject = lang.isObject
const isFunction = lang.isFunction

exports.std = std
function std (type, key, value) {
  return {type, key, value}
}

exports.match = match
function match (pattern, func) {
  return isFunction(pattern)
    ? (state, event) => pattern(event) ? func(state, event) : state
    : match(toTest(pattern), func)
}

exports.on = on
function on (type, func) {
  return match({type}, (state, event) => (
    func(state, event.key, event.value)
  ))
}

exports.one = one
function one (type, func) {
  return match({type, key: Boolean}, (state, event) => mergeAt(
    [event.key],
    state,
    func(readKey(event.key, state), event.key, event.value)
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

exports.update = update
function update (func) {
  return (prev, key, next) => func(prev, next)
}

exports.upgrade = upgrade
function upgrade (func) {
  return pipe(joinOverKey, func)
}

function joinOverKey (prev, key, next) {
  return isObject(next) ? mergeAt([], prev, next) : prev
}

exports.passNext = exports.passValue = passValue
function passValue (_, __, value) {
  return value
}

// TODO deprecate.
exports.mapTo = mapTo
function mapTo (func) {
  return value => isArray(value) ? value.map(func) : []
}

// TODO deprecate.
exports.mapToKey = mapToKey
function mapToKey (key) {
  return isFunction(key)
    ? bind(mapKeys, key)
    : mapToKey(value => value[key])
}

// TODO deprecate.
exports.mapAndGroup = mapAndGroup
function mapAndGroup (func, key) {
  return pipe(passValue, mapTo(func), mapToKey(key))
}
