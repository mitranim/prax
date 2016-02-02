'use strict'

var values = require('./dist/event-loop')
for (var key in values) exports[key] = values[key]
