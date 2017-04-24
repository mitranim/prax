'use strict'

function reexport (foreignExport) {
  for (const key in foreignExport) exports[key] = foreignExport[key]
}

reexport(require('fpx'))
reexport(require('espo'))
reexport(require('emerge'))
reexport(require('./misc'))
reexport(require('./react'))
