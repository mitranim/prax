'use strict'

var values = require('./dist/subs')
for (var key in values) exports[key] = values[key]
