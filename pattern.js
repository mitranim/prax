'use strict'

var values = require('./dist/pattern')
for (var key in values) exports[key] = values[key]
