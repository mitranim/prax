'use strict'

function reexport (foreign) {
  for (const key in foreign) exports[key] = foreign[key]
}

reexport(require('emerge'))
reexport(require('fpx'))
reexport(require('./app'))
reexport(require('./que'))
reexport(require('./words'))
