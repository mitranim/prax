'use strict'

const emerge = require('emerge')
const mergeAt = emerge.mergeAt
const replaceAt = emerge.replaceAt
const readAtPath = emerge.readAtPath

const toTest = require('./pattern').toTest

const lang = require('./lang')
const pipe = lang.pipe
const slice = lang.slice
const mapKeys = lang.mapKeys
const readKey = lang.readKey
const isArray = lang.isArray
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
    state,
    [event.key],
    func(readKey(state, event.key), event.key, event.value)
  ))
}

exports.manage = manage
function manage (path) {
  return slice(arguments, 1).map(manageOne(path))
}

function manageOne (path) {
  return func => (state, event) => (
    mergeAt(state, path, func(readAtPath(state, path), event))
  )
}

exports.upgrade = upgrade
function upgrade (func) {
  return pipe(joinOverKey, func)
}

exports.joinOverKey = joinOverKey
function joinOverKey (prev, key, next) {
  return mergeAt(prev, [], next)
}

exports.reduceIterator = reduceIterator
function reduceIterator (event) {
  return (acc, func) => replaceAt(acc, [], func(acc, event))
}

exports.computeIterator = computeIterator
function computeIterator (state) {
  return (acc, func) => replaceAt(acc, [], func(state, acc))
}

exports.passNext = passNext
function passNext (prev, key, next) {
  return next
}

exports.mapTo = mapTo
function mapTo (func) {
  return value => isArray(value) ? value.map(func) : []
}

exports.mapToKey = mapToKey
function mapToKey (key) {
  return isFunction(key)
    ? value => mapKeys(value, key)
    : mapToKey(value => value[key])
}

exports.mapAndGroup = mapAndGroup
function mapAndGroup (func, key) {
  return pipe(passNext, mapTo(func), mapToKey(key))
}
