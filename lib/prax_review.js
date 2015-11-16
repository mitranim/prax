'use strict'

let trap = {}
let data = {}
let keysInUse = []

function autorun(func) {
  keysInUse = []
  func()
  keysInUse.forEach(key => {
    trap[key] = trap[key] || []
    trap[key].push(func)
  })
}

function read(key) {
  keysInUse.push(key)
  return data[key]
}

function write(key, value) {
  data[key] = value
  emit([key])
}

function emit(keys) {
  keys.forEach(key => {
    const funcToRun = (trap[key] || [])
    funcToRun.forEach(func => {
      func()
    })
  })
}

// Sample

function sample() {
  console.log("first " + read('foo'))
  console.log("first " + read('boo'))
}

function sample1() {
  console.log("second " + read('foo'))
}

write('foo', 'bob')
write('boo', 'amely')

autorun(sample)
autorun(sample1)

write('foo', 'mark')
write('boo', 'elsa')






















