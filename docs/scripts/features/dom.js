const React = require('react')
const ReactDOM = require('react-dom')
const {PraxComponent, Runner, byPath, equal, get, putIn, putInBy, test} = require('prax')
const {addEvent, journal, smoothScrollYToSelector, smoothScrollToTop, originHref} = require('../utils')
const {Root} = require('../views')

export function onInit (env) {
  PraxComponent.prototype.env = env

  const rootNode = document.getElementById('root')

  if (rootNode) {
    ReactDOM.render(<Root />, rootNode)
    env.onDeinit(() => {
      ReactDOM.unmountComponentAtNode(rootNode)
    })
  }

  env.onDeinit(addEvent(document, 'keydown', ({keyCode}) => {
    env.atom.swap(putIn, ['keyCode'], keyCode)
  }))

  function updateLocation (location) {
    env.atom.swap(putInBy, ['nav'], nav => ({
      prevLocation: get(nav, 'location'),
      location,
    }))
  }

  updateLocation(journal.location)

  env.onDeinit(journal.listen(updateLocation))

  // Scroll behaviour
  const runner = Runner.loop(({deref}) => {
    const prev = deref(byPath(env.atom, ['nav', 'prevLocation']))
    const next = deref(byPath(env.atom, ['nav', 'location']))

    if (!prev || !next) return

    // HMR
    if (equal(prev, next)) return

    if (journal.action === 'POP') {
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

  env.onDeinit(() => runner.deinit())
}

const localHrefReg = new RegExp(`^${originHref}`, 'i')

// Makes a regular anchor click behave like a react-router link click. Can't
// distinguish regular anchors from Links. Should be attached to elements that
// host embedded markdown.
export function maybeInterceptAnchorNavigation (event) {
  const anchor = findParent(isAnchor, event.target)
  if (!anchor || !localHrefReg.test(anchor.href)) return
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
