'use strict'

var values = require('./dist/que')
for (var key in values) exports[key] = values[key]
