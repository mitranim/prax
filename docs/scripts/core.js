import {createAtom} from 'prax'

/**
 * State
 */

const atom = createAtom({
  stamp: null,
  key: null,
  persons: null,
  updating: null,
  initing: false
})

export const {read, set, patch, subscribe, watch} = atom

/**
 * History Utils
 */

import {queryWatcher} from 'prax/query'
import {toTest} from 'prax/mb'

export const matchValue = (query, cond, func) => (
  cond = toTest(cond),
  subscribe(queryWatcher(query, (path, prev, next) => {
    if (cond(next)) func(path, next)
  }))
)

/**
 * Render Utils
 */

import {Component} from 'react'
import {createAuto, createReactiveRender} from 'prax/react'

export const auto = createAuto(Component, watch)
export const reactiveRender = createReactiveRender(watch)

/**
 * App Logic
 */

require('./factors')

set(['initing'], true)

/**
 * Utils
 */

if (window.developmentMode) {
  window.atom = atom
  window.read = read
  window.set = set
  window.patch = patch
}
