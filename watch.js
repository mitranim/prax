'use strict'

var values = require('./dist/watch')
for (var key in values) exports[key] = values[key]
