const React = require('react')
const ReactDOM = require('react-dom')
const {PraxComponent, Reaction,
  byPath, equal, get, putIn, putInBy, test} = require('prax')
const {addEvent, journal, originHref, onlyString,
  smoothScrollYToSelector, smoothScrollToTop} = require('../utils')
const {Root} = require('../views')

export function onInit (env) {
  env.onDeinit(addEvent(document, 'keydown', ({keyCode}) => {
    env.atom.swap(putIn, ['keyCode'], keyCode)
  }))

  // Location

  function updateLocation (location) {
    env.atom.swap(putInBy, ['nav'], nav => ({
      lastAction: journal.action,
      prevLocation: get(nav, 'location'),
      location,
    }))
  }

  updateLocation(journal.location)

  env.onDeinit(journal.listen(updateLocation))

  // Rendering

  PraxComponent.prototype.env = env

  const rootNode = document.getElementById('root')

  if (rootNode) {
    ReactDOM.render(<Root />, rootNode)
    env.onDeinit(() => {
      ReactDOM.unmountComponentAtNode(rootNode)
    })
  }

  // Scroll

  const reaction = Reaction.loop(({deref}) => {
    const prev = deref(byPath(env.atom, ['nav', 'prevLocation']))
    const next = deref(byPath(env.atom, ['nav', 'location']))
    const action = deref(byPath(env.atom, ['nav', 'lastAction']))

    if (!prev && next && next.hash) {
      // Probably initial page load. We need to adjust the scroll position
      // because the browser doesn't account for the fixed header. If the page
      // got refreshed in-place, Chrome will overwrite this with the previous
      // scroll position, after a brief flicker. Haven't tested other browsers.
      smoothScrollYToSelector(120, next.hash)
      return
    }

    if (!prev || !next) return

    // HMR
    if (equal(prev, next)) return

    if (action === 'POP') {
      // Stimulate the browser to restore the scroll position.
      forceLayoutHeight()
      return
    }

    if (next.hash) {
      smoothScrollYToSelector(120, next.hash)
      return
    }

    smoothScrollToTop(120)
  })

  env.onDeinit(() => reaction.deinit())
}

const localHrefReg = new RegExp(`^${originHref}`, 'i')

// Makes a regular anchor click behave like a react-router link click. Can't
// distinguish regular anchors from Links. Should be attached to elements that
// host embedded markdown.
export function maybeInterceptAnchorNavigation (event) {
  const anchor = findParent(isAnchor, event.target)
  if (
    !anchor ||
    !localHrefReg.test(anchor.href) ||
    event.altKey ||
    event.ctrlKey ||
    event.metaKey ||
    event.shiftKey
  ) return
  event.preventDefault()
  journal.push(anchor.href.replace(localHrefReg, ''))
}

function findParent (test, node) {
  return test(node)
    ? node
    : node.parentNode && findParent(test, node.parentNode)
}

const isAnchor = test({tagName: 'A'})

function forceLayoutHeight () {
  // Force height measurement to ensure proper scroll restoration when
  // navigating back and forward. This must be done after a rendering phase.
  document.body.scrollHeight
}

// Ridiculous. This is a consequence of compiling markdown to HTML, and of the
// :target selector not working with pushState. Should look deeper into
// markdown-React integration.
export function correctPageAnchors (text, deref, atom) {
  const id = onlyString(deref(byPath(atom, ['nav', 'location', 'hash']))).replace(/^#/, '')
  const path = onlyString(deref(byPath(atom, ['nav', 'location', 'pathname']))).replace(/^\//, '')
  return onlyString(text)
    .replace(/href="#(.*)"/g, `href="${path}#$1"`)
    .replace(`id="${id}"`, `id="${id}" class="hash-target-active"`)
}
