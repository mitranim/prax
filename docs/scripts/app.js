import 'stylific'
import {autorun, Source} from 'prax'

window.prax = require('prax')

const stamp = new Source(window.performance.now() | 0)
const key = new Source()

autorun(function () {
  const elem = document.querySelector('[data-print]')
  if (!elem) return

  while (elem.firstChild) elem.firstChild.remove()

  elem.insertAdjacentHTML('afterBegin', `
  <p>ms elapsed since page load: ${stamp.read() || ''}</p>
  <p>last pressed key's code: ${key.read() || ''}</p>`)
})

setInterval(function () {
  stamp.write(window.performance.now() | 0)
}, 1000)

document.addEventListener('keypress', event => {
  key.write(event.keyCode)
})
