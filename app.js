'use strict'

var values = require('./dist/app')
for (var key in values) exports[key] = values[key]
