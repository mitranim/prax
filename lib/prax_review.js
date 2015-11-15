'use strict'

let watchers = []
let mode = undefined
let isInterested = false
let current = {}

function watch(func) {
  watchers.push(func)
}

function write(key, value) {
  current = { key, value }
  mode = 'perquisition'
  const funcs = watchers.filter(func => {
    isInterested = false
    func()
    return isInterested
  })
  mode = undefined
  funcs.forEach(func => { func() })
}

// Not pure yet
// It looks to global mode and if it perquisition tell about fields that it need
function read(key) {
  if (mode === 'perquisition') {
    isInterested = current.key === key
  }

  if (current.key === key) {
    return current.value
  }
}

function logger(msg) {
  console.log(msg)
}

const readPlace = function() {
  logger( "hello from read place " + read('name') )
}

watch(readPlace);

write('name', 'hello world!')