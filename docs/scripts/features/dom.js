const React = require('react')
const ReactDOM = require('react-dom')
const {PraxComponent, byPath} = require('prax')
const {Reaction, Agent} = require('espo')
const {equal, putIn, putInBy} = require('emerge')
const {test} = require('fpx')
const {CleanupQue, addEvent, journal, originHref, onlyString,
  smoothScrollYToWithin, smoothScrollToTop} = require('../utils')
const {Root} = require('../views')

export class Dom extends Agent {
  constructor (env) {
    super({
      reaction: new Reaction(),
      cleanup: new CleanupQue(),
      nav: null,
    })
    this.env = env
  }

  updateNav () {
    this.swap(putInBy, ['nav'], nav => ({
      lastAction: journal.action,
      prevLocation: nav && nav.location,
      location: journal.location,
    }))
  }

  init () {
    const {env} = this
    const {cleanup, reaction} = this.deref()

    this.updateNav()

    cleanup.push(addEvent(document, 'keydown', ({keyCode}) => {
      env.swap(putIn, ['keyCode'], keyCode)
    }))

    // Rendering

    PraxComponent.prototype.env = env

    const rootNode = document.getElementById('root')

    if (rootNode) {
      ReactDOM.render(<Root />, rootNode)
      cleanup.push(() => {
        ReactDOM.unmountComponentAtNode(rootNode)
      })
    }

    // Scroll

    reaction.loop(({deref}) => {
      const prev = deref(byPath(this, ['nav', 'prevLocation']))
      const next = deref(byPath(this, ['nav', 'location']))
      const action = deref(byPath(this, ['nav', 'lastAction']))

      if (!prev && next && next.hash) {
        // Probably initial page load. We need to adjust the scroll position
        // because the browser doesn't account for the fixed header. If the page
        // got refreshed in-place, Chrome will overwrite this with the previous
        // scroll position, after a brief flicker. Haven't tested other browsers.
        smoothScrollYToWithin({milliseconds: 300, selector: next.hash})
        return
      }

      if (!prev || !next) return

      // HMR
      if (equal(prev, next)) return

      if (action === 'POP' && !next.hash) {
        // Stimulate the browser to restore the scroll position.
        forceLayoutHeight()
        return
      }

      if (next.hash) {
        smoothScrollYToWithin({milliseconds: 300, selector: next.hash})
        return
      }

      smoothScrollToTop({milliseconds: 300})
    })
  }
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

// Ridiculous. This demonstrates a conflict between markdown->HTML and React.
// It's also a consequence of the :target selector not working with pushState.
// Should look deeper into markdown-React integration.
export function correctPageAnchors ({hash, pathname}, text) {
  const id = hash.replace(/^#/, '')
  const path = pathname.replace(/^\//, '')
  return onlyString(text)
    .replace(/href="#(.*)"/g, `href="${path}#$1"`)
    .replace(`id="${id}"`, `id="${id}" class="hash-target-active"`)
}
