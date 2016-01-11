import {set, patch, matchValue} from './core'

matchValue(['updating', 'persons', Boolean], Boolean, (path, value) => {
  setTimeout(() => {
    patch(['persons', path[2]], value)
  }, 1000)
})

/**
 * Mock
 */

matchValue(['initing'], true, () => {
  set(['initing'], undefined)
})

matchValue(['initing'], true, () => {
  const persons = [
    {name: 'Atlanta', age: 1000},
    {name: 'Kara', age: 2000},
    {name: 'Moira', age: 3000}
  ]

  let i = -1

  function mockUpdate () {
    set(['updating', 'persons', 1], {
      id: 1,
      ...persons[++i % persons.length]
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
