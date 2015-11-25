'use strict'

const addons = require('./dist/react')
Object.keys(addons).forEach(function (key) {exports[key] = addons[key]})
