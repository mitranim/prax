const {default: createBrowserHistory} = require('history/createBrowserHistory')

const baseNode = document.querySelector('head base')

const baseHref = (baseNode && baseNode.getAttribute('href')) || ''

export const journal = createBrowserHistory({
  basename: baseHref || null,
})

export const originHref = baseHref
  ? `${window.location.origin}${baseHref}`
  : window.location.origin
