'use strict'

// Backwards compat
const words = require('../words')
for (const key in words) exports[key] = words[key]
exports.match = words.onEvent
exports.ifonly = require('fpx').ifonly
