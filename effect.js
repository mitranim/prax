'use strict'

var values = require('./dist/effect')
for (var key in values) exports[key] = values[key]
