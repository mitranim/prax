'use strict'

function reexport (foreign) {
  for (const key in foreign) exports[key] = foreign[key]
}

reexport(require('fpx'))
reexport(require('espo'))
reexport(require('emerge'))
reexport(require('./words'))
