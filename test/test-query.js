'use strict'

/** ***************************** Dependencies *******************************/

const deepEqual = require('emerge').deepEqual

const createAtom = require('../lib/index').createAtom
const findPaths = require('../lib/query').findPaths
const queryWatcher = require('../lib/query').queryWatcher

/** ********************************* Test ***********************************/

/**
 * Globals
 */

let value, paths, expected

/**
 * findPaths
 */

paths = findPaths(value, [])
expected = [[]]
if (!deepEqual(paths, expected)) throw Error()

paths = findPaths(value, [Boolean])
expected = []
if (!deepEqual(paths, expected)) throw Error()

value = {one: 1, two: {three: 3}}
paths = findPaths(value, [])
expected = [[]]
if (!deepEqual(paths, expected)) throw Error()

paths = findPaths(value, [Boolean])
expected = [['one'], ['two']]
if (!deepEqual(paths, expected)) throw Error()

value = {one: 1, two: {three: {four: 4, five: 5}}}
paths = findPaths(value, [Boolean, 'three', Boolean])
expected = [['two', 'three', 'four'], ['two', 'three', 'five']]
if (!deepEqual(paths, expected)) throw Error()

/**
 * queryWatcher
 */

const prev = {
  one: {two: 2},
  four: NaN
}

const next = {
  one: {two: [2]},
  four: 4
}

const atom = createAtom(prev)

let path
let prevValue
let nextValue

atom.subscribe(queryWatcher(['one', Boolean], (_path, _prev, _next) => {
  path = _path
  prevValue = _prev
  nextValue = _next
}))

atom.patch([], next)

if (!deepEqual(atom.read(), {one: {two: [2]}, four: 4})) throw Error()
if (!deepEqual(path, ['one', 'two'])) throw Error()
if (prevValue !== 2) throw Error()
if (!deepEqual(nextValue, [2])) throw Error()
