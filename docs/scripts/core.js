import {createAtom, createMb} from 'prax'

/**
 * State
 */

const atom = createAtom({
  stamp: null,
  key: null,
  persons: null
})

export const {read, set, patch, watch} = atom

/**
 * Message Bus
 */

const mb = createMb()

export const {send, match} = mb

/**
 * Render Utils
 */

import {Component} from 'react'
import {createAuto} from 'prax/react'

export const auto = createAuto(Component, watch)

/**
 * App Logic
 */

require('./factors')

send('init')

/**
 * Utils
 */

if (window.developmentMode) {
  window.atom = atom
  window.set = set
  window.patch = patch
  window.read = read
  window.mb = mb
  window.send = send
}
