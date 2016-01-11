import {createMb} from 'prax/mb'
import {set, patch, send, match} from './core'

match({type: 'person/update'}, ({value}) => {
  patch(['persons', value.id], value)
})

/**
 * Mock
 */

match('init', () => {
  const persons = [
    {name: 'Atlanta', age: 1000},
    {name: 'Kara', age: 2000},
    {name: 'Moira', age: 3000}
  ]

  let i = -1

  function mockUpdate () {
    send({
      type: 'person/update',
      value: {
        id: 1,
        ...persons[++i % persons.length]
      }
    })
  }

  mockUpdate()
  setInterval(mockUpdate, 2000)

  setInterval(() => {
    set(['stamp'], window.performance.now() | 0)
  }, 1000)

  document.addEventListener('keypress', event => {
    set(['key'], event.keyCode)
  })
})

match({type: 'test', value: isNumber}, createMb(
  {value: 1}, ({value}) => {
    console.log('-- one:', value)
  },

  {type: 'test', value: 2}, ({value}) => {
    console.log('-- two:', value)
  },

  Boolean, () => {}
).send)

/**
 * Utils
 */

function isNumber (value) {
  return typeof value === 'number'
}
