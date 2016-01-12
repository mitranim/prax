'use strict'

require('./test-atom')
require('./test-mb')
require('./test-query')

console.log(`[${pad(new Date().getHours())}:${pad(new Date().getMinutes())}:${pad(new Date().getSeconds())}] Finished test without errors.`)

function pad (val) {
  val = String(val)
  return val.length < 2 ? ('0' + val) : val
}
