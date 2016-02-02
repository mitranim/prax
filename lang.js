'use strict'

var values = require('./dist/lang')
for (var key in values) exports[key] = values[key]
