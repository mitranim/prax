'use strict'

function reexport (foreign) {
  for (const key in foreign) exports[key] = foreign[key]
}

reexport(require('../'))
reexport(require('../dist/bc-words'))
