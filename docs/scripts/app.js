import 'simple-pjax'
import React from 'react'
import {render, unmountComponentAtNode} from 'react-dom'

// This must be executed before evaluating other modules.
if (module.hot) {
  module.hot.accept(err => {
    console.warn('Exception during HMR update.', err)
  })
}

/**
 * Views
 */

const {State, Profile} = require('./views')
const {KeyCode} = require('./classes')

const views = {
  '[data-state]': State,
  '[data-profile]': Profile,
  '[data-key-code]': KeyCode
}

/**
 * Setup/Teardown
 */

const {slice} = require('prax/lang')
const {domEvent, onload} = require('./utils')

const nodes = []

function setup () {
  for (const selector in views) {
    const View = views[selector]
    slice(document.querySelectorAll(selector)).forEach(element => {
      render(<View />, element)
      nodes.push(element)
    })
  }
}

function teardown () {
  nodes.splice(0).forEach(unmountComponentAtNode)
}

domEvent(module, document, 'simple-pjax-before-transition', teardown)

domEvent(module, document, 'simple-pjax-after-transition', setup)

if (module.hot) module.hot.dispose(teardown)

onload(setup)
