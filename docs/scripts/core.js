// Core utilities.
import {createAtom, createMb} from 'prax'
// Extras.
import {asyncStrategy} from 'prax/async'

/**
 * State
 */

export const atom = createAtom({
  stamp: null,
  key: null,
  persons: null
}, asyncStrategy)

export const {read, set, patch, watch, stop} = atom

/**
 * Message Bus
 */

const mb = createMb()

export const {send, match} = mb

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
