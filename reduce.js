'use strict'

var values = require('./dist/reduce')
for (var key in values) exports[key] = values[key]
