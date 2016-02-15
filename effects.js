'use strict'

var values = require('./dist/effects')
for (var key in values) exports[key] = values[key]
