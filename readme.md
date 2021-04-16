## Overview

Experimental HTML/DOM rendering system for hybrid SSR + SPA apps. See [Why](#why) for the why this exists. In short: performance and _radical_ simplicity.

* No VDOM.
* No diffing.
* No library classes.
* No intermediate representations. Render directly to a string in Node, directly to DOM nodes in browsers.
* Render only once. Use native [custom elements](https://developer.mozilla.org/en-US/docs/Web/Web_Components/Using_custom_elements) for state.
* Replace instead of reflowing.
* No build system required.

Tiny (a few kilobytes _un_-minified) and dependency-free. Native JS module.

## TOC

* [Why](#why)
* [Usage](#usage)
* [API](#api)

## Why

### Why not React?

#### Bad for SSR+SPA

React seems _particularly_ unfit for hybrid SSR + SPA apps. Your ideal flow:

* On any request, render the _entire_ page in Node.
* The content is fully built. It has no JS placeholders, doesn't require any ajax, and doesn't contain invisible data.
* Load the same JS into the browser. Enable interactive components and pushstate links. No initial ajax.
* On pushstate transitions, fetch data and render pages entirely in the browser. The rendering code is fully isomorphic between Node and browsers.

If the entire page was rendered with React, then to activate the interactive parts, you must _re-render_ the entire page with React. In the browser. On a page that was already rendered. This is ludicrously wasteful. In my current company's app, this easily takes 500ms of CPU time on many pages (using Preact). To make it worse, because markup is a function of data (regardless of your rendering library), this requires the _original data_, which you must either invisibly inline into HTML (wasted traffic, SEO deranking), or re-fetch in the browser (wasted traffic, server load). This is insane.

For apps with SSR, a better approach is to activate interactive components in-place without any "render". Native custom elements are a particularly good fit for this. This requires separating the _markup_ code from the _stateful behavior_ code. React is predicated on the idea of _co-locating_ markup and state. You could still render your markup with React, but when markup is stateless, this is pointlessly inefficient. Prax can do it much faster, while also using JSX. (Or not.)

#### Slow

React's rendering model is _inefficient by design_. Svelte's creator did a better job explaining this: https://svelte.dev/blog/virtual-dom-is-pure-overhead.

The _design_ inefficiencies described above shouldn't apply to the initial page render in Node, when there's nothing to diff against. However, there are also needless _implementation_ inefficiencies. My benchmarks are for Preact, which we've been using over React for size reasons. At my current company, replacing `preact@10.5.13` and `preact-render-to-string@5.1.18` with the initial, naive and almost unoptimized Prax has yielded x5 better performance in Node, and somewhere between x3 and x8 (depending on how you measure) better in browsers, for rendering big pages. In addition, switching to custom elements for stateful components allows to completely eliminate the in-browser initial render, which was hitching the CPU for 500ms on some pages, while also eliminating the need to fetch or inline a huge amount of data that was required for that render.

Parts of the overhead weren't in Preact itself, but merely encouraged by it. In SSR, components would initialize state, create additional owned objects, bind callbacks, and establish implicit reactive subscriptions, even though this would all be wasted. This doesn't excuse an unfit model, and the performance improvement was real.

#### Large

The final nail in the coffin is library size. By now React has bloated to what, 100+ KiB minified? More? Prax is a few kilobytes _un_-minified.

### Why not Svelte?

Svelte has similar design goals, but seems to require a build system, which automatically invalidates it for me. With native module support in browsers, you can _run from source_. Don't squander this.

### Why not framework X?

Probably never heard of X! For the very specific requirements implied above, it was faster to make a fit, than to search among the thousands of unfits. If an _exact_ fit already existed, let me know.

## Usage

```sh
npm i -E prax
```

This example uses JSX, but Prax is _designed_ to be usable without it. See plain JS below.

```js
import {F, Raw} from 'prax'

function main() {
  const html = Html({title: 'home', body: Index()})

  // In Node, this is a string.
  // In browsers, this is a DOM tree.
  console.log(html)
}

// Wrapper for SSR only.
function writeHtml(res, html) {
  const doc = F(new Raw(`<!doctype html>`), html)
  res.end(String(doc))
}

// For SSR + SPA.
function Html({title, body}) {
  return (
    <html lang='en'>
      <head>
        <link rel='stylesheet' href='/styles/main.css' />
        {!title ? null : <title>{title}</title>}
      </head>
      <body>
        {body}
        <script type='module' src='/scripts/browser.mjs' />
      </body>
    </html>
  )
}

function Index() {
  return (
    <div>Hello world!</div>
  )
}
```

Use Prax with plain JS. Use native modules and run your app _from source_ without a build system.

```js
import {E} from 'prax'

function Index() {
  return E('div', {class: 'some-class'}, `Hello world!`)
}
```

## API

## License

https://unlicense.org

## Misc

I'm receptive to suggestions. If this library _almost_ satisfies you but needs changes, open an issue or chat me up. Contacts: https://mitranim.com/#contacts
