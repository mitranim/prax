## Overview

Experimental HTML/DOM rendering system for hybrid SSR + SPA apps. See [Why](#why). In short: performance and _radical_ simplicity.

* No VDOM.
* No diffing.
* No library classes.
* No templates. No string parsing. Just function calls.
* No intermediate representations. Render directly to a string in Node, directly to DOM nodes in browsers.
* Render only once. Use native [custom elements](https://developer.mozilla.org/en-US/docs/Web/Web_Components/Using_custom_elements) for state. (Out of scope for Prax.)
* Replace instead of reflowing.
* No build system required.

Tiny (a few kilobytes _un_-minified) and dependency-free. Native JS module.

## TOC

* [Why](#why)
* [Usage](#usage)
* [API](#api)
  * [`E`](#etype-props-children)
  * [`S`](#stype-props-children)
  * [`F`](#fchildren)
  * [`reset`](#resetelement-props-children)
  * [`e`](#etype-props-children-1)
  * [Undocumented](#undocumented)
  * [React Compat](#react-compat)
* [Imperative, Synchronous](#imperative-synchronous)
* [Direct Instantiation](#direct-instantiation)
* [Props](#props)
* [Children](#children)
* [Stringable](#stringable)
* [JSX](#jsx)

## Why

### Why not React?

#### Bad for SSR+SPA

React seems _particularly_ unfit for hybrid SSR + SPA apps. Your ideal flow:

* On any request, render the _entire_ page in Node.
* The user gets the fully-built content. It has no JS placeholders, doesn't require any ajax, and doesn't contain invisible JSON.
* Load the same JS into the browser. Enable interactive components and pushstate links. No initial ajax.
* On pushstate transitions, fetch data and render pages entirely in the browser. The rendering code is fully isomorphic between Node and browsers.

If the entire page was rendered with React, then to activate the interactive parts, you must load all that JS and _re-render_ the entire page with React. In the browser. On a page that was already rendered. This is ludicrously wasteful. In my current company's app, this easily takes 500ms of CPU time on many pages (using Preact). To make it worse, because markup is a function of data (regardless of your rendering library), this requires the _original data_, which you must either invisibly inline into HTML (wasted traffic, SEO deranking), or re-fetch in the browser (wasted traffic, server load). This is insane.

For apps with SSR, a better approach is to activate interactive components in-place without any "render". Native custom elements are a particularly good fit for this. This requires separating the _markup_ code from the _stateful behavior_ code. React is predicated on the idea of co-locating markup and state. You could still render your markup with React, but when markup is stateless, this is pointlessly inefficient. Prax can do it much faster, while optionally using JSX.

#### Slow

React's rendering model is _inefficient by design_. Svelte's creator did a better job explaining this: https://svelte.dev/blog/virtual-dom-is-pure-overhead.

The _design_ inefficiencies described above shouldn't apply to the initial page render in Node, when there's nothing to diff against. However, there are also needless _implementation_ inefficiencies. My benchmarks are for Preact, which we've been using over React for size reasons. At my current company, replacing `preact@10.5.13` and `preact-render-to-string@5.1.18` with the initial, naive and almost unoptimized Prax has yielded x5 better performance in Node, and somewhere between x3 and x8 (depending on how you measure) better in browsers, for rendering big pages. In addition, switching to custom elements for stateful components allows to completely eliminate the in-browser initial render, which was hitching the CPU for 500ms on some pages, while also eliminating the need to fetch or inline a huge amount of data that was required for that render.

Parts of the overhead weren't in Preact itself, but merely encouraged by it. In SSR, components would initialize state, create additional owned objects, bind callbacks, and establish implicit reactive subscriptions, even though this would all be wasted. This doesn't excuse an unfit model, and the performance improvement was real.

#### Large

By now React has bloated to what, 100+ KiB minified? More? Fortunately, Preact solves that (≈10 KiB minified at the time of writing). Prax is even smaller; a few kilobytes _un_-minified, with no dependencies.

### Why not Svelte?

Svelte has similar design goals, but seems to require a build system, which automatically invalidates it for me. With native module support in browsers, you can _run from source_. Don't squander this.

Prax targets a particular breed of SSR+SPA apps, for which Svelte might be unfit. I haven't checked Svelte's server-rendering story. See the constraints outlined above.

### Why not framework X?

Probably never heard of X! For the very specific requirements outlined above, it was faster to make a fit, than to search among the thousands of unfits. If one already existed, let me know.

## Usage

```sh
npm i -E prax
```

This example uses plain JS. Prax is also [compatible with JSX](#jsx). For a better experience, use native modules and run your app from source in both Node and browsers.

```js
import {E} from 'prax'

function main() {
  const html = Html({title: 'home', body: Index()})
  console.log(html)
}

function Html({title, body}) {
  return (
    E('html', {lang: 'en'},
      E('head', {},
        E('link', {rel: 'stylesheet', href: '/styles/main.css'}),
        !title ? null : E('title', {}, title),
      ),
      E('body', {},
        body,
        E('script', {type: 'module', src: '/scripts/browser.mjs'}),
      ),
    )
  )
}

function Index() {
  return E('div', {class: 'some-class'}, `Hello world!`)
}
```

JSX example. See [notes on JSX compatibility](#jsx).

```js
function main() {
  const html = Html({title: 'home', body: Index()})

  // In Node, this is a string.
  // In browsers, this is a DOM tree.
  console.log(html)
}

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
    <div class='some-class'>Hello world!</div>
  )
}
```

## API

In Prax, rendering functions ([`E`](#etype-props-children)/[`S`](#stype-props-children)/[`F`](#fchildren)) return different output in Node and browsers. But you import and call them the same way. Prax provides the module `node.mjs` for Node, and the module `prax.mjs` for browsers. Its `package.json` specifies which file should be imported where, in ways understood by Node and bundlers such as Webpack. You should be able to just:

```js
import * as x from 'prax'
```

Also, you don't need a bundler! JS modules are natively supported by evergreen browsers, but you'll need an importmap. Importmap support is polyfillable. You could also use a bundler _just_ for production builds.

```html
<script type="importmap">
  {"imports": {"prax": "/node_modules/prax/prax.mjs"}}
</script>
```

### `E(type, props, ...children)`

Short for "element", abbreviated for frequent use. Renders an HTML element. In Node, returns a string (as `Raw` to indicate that it shouldn't be escaped). In browsers, returns a DOM node.

`type` must be a string. See [Props](#props) for props rules, and [Children](#children) for child rules.

```js
const node = E('div', {class: 'one'}, 'two')
console.log(node)
// Node.js: [String (Raw): '<div class="one">two</div>']
// Browser: <div class="one">two</div>
```

In browsers, `props` is passed to `document.createElement` as-is, in order to support creation of [customized built-in elements](https://developer.mozilla.org/en-US/docs/Web/API/CustomElementRegistry/define#customized_built-in_element) via `is`. Also see [Direct Instantiation](#direct-instantiation) for additional thoughts on this.

```js
class Btn extends HTMLButtonElement {}
customElements.define('a-btn', Btn, {extends: 'button'})

import {E} from 'prax'

// Works in Node and browsers. Creates a `Btn` in browsers.
E('button', {is: 'a-btn'})

// Equivalent to the above, but works only in browsers.
new Btn()
```

### `S(type, props, ...children)`

Exactly like [`E`](#etype-props-children), but generates SVG markup. In Node, either function will work, but in browsers, you _must_ use `S` for SVG. It uses `document.createElementNS` with the SVG namespace.

This is because unlike every template-based system (including React), Prax renders _immediately_. Nested function calls are evaluated inner-to-outer. When rendering an arbitrary element like `path` (there are many!), `E` has no way of knowing that it will eventually be included into `svg`. HTML parsers automate this because they parse _outer_ elements first.

```js
import {S} from 'prax'

function SomeIcon() {
  return S('svg', {class: 'my-icon'}, S('path', {}, '...'))
}
```

### `F(...children)`

Short for "fragment". Renders the children without an enclosing element. In Node, this simply combines their markup without any wrappers or delimiters, and returns a string as `Raw`. In browsers, this returns a [`DocumentFragment`](https://developer.mozilla.org/en-US/docs/Web/API/DocumentFragment).

You will rarely use this, because [`E`](#etype-props-children) supports arrays of children, nested to any depth. `F` is used internally by [`reset`](#resetelement-props-children). It's also handy for prepending a doctype at the top level. You could also interpolate strings, but `F` will sensibly handle nils, arrays, and so on.

```js
import {E, F, Raw} from 'prax'

function onRequest(req, res) {
  const doc = F(new Raw(`<!doctype html>`), Html())
  res.end(String(doc))
}

function Html() {
  return E('html', {},
    E('head', {}, '...'),
    E('body', {}, '...'),
  )
}
```

### `reset(Element, props, ...children)`

(Browser-specific API, only in `prax.mjs`.)

Mutates the element, resetting it to the given props and children, removing any previously-existing children. Attributes and properties missing from `props` are not affected. To unset existing attributes or properties, include them with the appropriate "zero value" (usually `null`/`undefined`).

`reset` carefully avoids destroying existing content in case of rendering exceptions. It buffers children in a temporary `DocumentFragment`, replacing the previous children only when fully built.

```js
import * as x from 'prax'

class Btn extends HTMLButtonElement {
  constructor() {
    super()
    this.onclick = this.onClick
  }

  onClick() {
    x.reset(this, {class: 'activated', disabled: true}, `clicked!`)
  }
}
customElements.define('a-btn', Btn, {extends: 'button'})
```

### `e(type, props, ...children)`

(Better name pending.) Tiny shortcut for making shortcuts. Performs [partial application](https://en.wikipedia.org/wiki/Partial_application) of [`E`](#etype-props-children) with the given arguments.

```js
export const a    = e('a')
export const div  = e('div')
export const bold = e('strong', {class: 'weight-bold'})

function Page() {
  return div({},
    a({href: '/'}, bold(`Home`)),
  )
}
```

### Undocumented

Some tools are exported but undocumented to avoid bloating the docs. The source code should be self-explanatory:

* `cls`
* `escapeText`
* `escapeAttr`
* `boolAttrs`
* `voidElems`
* `Raw`

### React Compat

The optional module `rcompat.mjs` exports a few functions for JSX compatibility and migrating code from React. See the section [JSX](#jsx) for usage examples.

* `R`
* `F` (different one)
* `countChildren`
* `mapChildren`

## Imperative, Synchronous

Imperative control flow and immediate, synchronous side effects are precious things. Don't squander them carelessly.

In Prax, everything is immediate. Rendering exceptions can be caught via `try/catch`. Magic context can be setup trivially in user code, via `try/finally`, without library support. Lifecycle stages such as "before render" and "after DOM mounting" can be done just by placing lines of code before and after a [`reset`](#resetelement-props-children) call. (Also via native lifecycle callbacks in custom elements.)

Compare the hacks and workarounds invented in React to implement the same trivial things.

## Direct Instantiation

Unlike most "modern" rendering libraries, Prax doesn't stand between you and DOM elements. Functions such as [`E`](#etype-props-children) are trivial shortcuts for `document.createElement`. This has nice knock-on effects for [custom elements](https://developer.mozilla.org/en-US/docs/Web/Web_Components/Using_custom_elements).

Isomorphic code that runs in Node and browsers must use `E`, because in Node you always render to a string. However, code that runs _only_ in the browser is free to use direct instantiation, with custom constructor signatures.

The following example is a trivial custom element that takes an observable object and displays one of its properties as text. Subscription and unsubscription is automatic. (Observable signature from [Espo → `Obs`](https://github.com/mitranim/espo).) You can simply `new MyElem()`, passing arbitrary inputs. No "props" involved in this. When using TS or Flow, signatures can be properly typed, without hacks and workarounds such as "prop types".

```js
import {E, reset} from 'prax'

function someMarkup() {
  return reset(new RecText(someObservable), {class: 'text'})
}

class RecText extends HTMLElement {
  constructor(observable) {
    super()
    this.obs = observable
  }

  connectedCallback() {
    this.obs.sub(this)
    this.trigger()
  }

  disconnectedCallback() {
    this.obs.unsub(this)
  }

  trigger() {
    this.textContent = this.obs.val
  }
}
customElements.define('a-rec-text', RecText)
```

## Props

Just like React, Prax conflates attributes and properties, calling everything "props". Here are the rules. The term "nil" stands for both `null` and `undefined`.

* Props as a whole are `nil | {}`.
* Any prop with a nil value is either removed, unset, or skipped, as appropriate.
* [`class`](https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/class) and [`className`](https://developer.mozilla.org/en-US/docs/Web/API/Element/className) are both supported, as `nil | string`.
* [`attributes`](https://developer.mozilla.org/en-US/docs/Web/API/Element/attributes) is `nil | {}`. Every key-value is assumed to be an attribute, even in browsers, and follows the normal attribute assignment rules; see below.
* [`style`](https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/style) is `nil | string | {}`. If `{}`, it must have `camelCase` keys, matching the structure of a [`CSSStyleDeclaration`](https://developer.mozilla.org/en-US/docs/Web/API/CSSStyleDeclaration) object. Values are `nil | string`.
* [`dataset`](https://developer.mozilla.org/en-US/docs/Web/API/HTMLOrForeignElement/dataset) must be `nil | {}`, where keys are `camelCase` without the `data-` prefix. Values follow the attribute encoding rules. In Node, `dataset` is converted to [`data-*`](https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/data-*) attributes. You can also just use those attributes.
* [`innerHTML`](https://developer.mozilla.org/en-US/docs/Web/API/Element/innerHTML) works in both environments, and must be `nil | string`.
* [`for`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/label#attr-for) and [`htmlFor`](https://developer.mozilla.org/en-US/docs/Web/API/HTMLLabelElement/htmlFor) both work, and must be `nil | string`.
* ARIA properties such as [`ariaCurrent`](https://developer.mozilla.org/en-US/docs/Web/API/Element/ariaCurrent) work in both environments, and must be `nil | string`. In Node, they're converted to kebab-cased `aria-*` attributes. You can also just use those attributes.
* The value of any attribute, or a DOM property whose type is known to be `string`, must be either `nil` or [stringable](#stringable).

Additional environment-specific rules:

* In Node, everything non-special-cased is assumed to be an attribute, and must be `nil` or [stringable](#stringable).
* In browsers, there's a heuristic for deciding whether to assign a property or attribute. Prax will try to default to properties, but use attributes as a fallback for properties that are completely unknown or whose value doesn't match the type expected by the DOM.

Unlike React, Prax has _no made-up properties_ or weird renaming. Use `onclick` rather than `onClick`, `oninput` rather than `onChange`, and so on.

## Children

All rendering functions, such as [`E`](#etype-props-children) or [`reset`](#resetelement-props-children), take `...children` as [rest parameters](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/rest_parameters) and follow the same rules:

* Nil (`null` or `undefined`) is ignored.
* `''` is also ignored (doesn't create a `Text` node).
* `[]` is traversed, recursively if needed. The following are all equivalent: `a, b, c` | `[a, b, c]` | `[[a], [[[b, [[c]]]]]]`.
* As a consequence of the previous rules, `[null, [undefined]]` is the same as no children at all.
* Other primitives (numbers, bools, symbols) are stringified.
* `new String` strings (of any subclass) are considered "inner HTML". In Node, their content is included verbatim and not escaped. In browsers, their content is parsed into DOM nodes, similarly to `innerHTML`.
* Anything else must be a [stringable object](#stringable).

In Node, _after_ resolving all these rules, the output string is escaped, following [standard rules](https://www.w3.org/TR/html52/syntax.html#escaping-a-string). The only exception is `new String` strings, which are verbatim.

Caution: literal content of `script` elements may require additional escaping when it contains `</script>` inside strings, regexps, and so on. The following example generates broken markup, and will display a visible `')`. Prax currently doesn't escape this automatically.

```js
<script>console.log('</script>')</script>
```

## Stringable

Prax's stringification rules are carefully designed to minimize gotchas and bugs.

* `null` and `undefined` are equivalent to `''`.
* Other primitives are stringified. (For example, `0` → `'0'`, `false` → `'false'`, `NaN` → `'NaN'`.)
* Objects without a custom `.toString` method are forbidden and cause an exception. This includes `{}` and a variety of other classes. This is a bug prevention measure: the vast majority of such objects are never intended for rendering, and are only passed accidentally.
* Other objects are stringified via their `.toString`. For example, rendering a `Date` or `URL` object is OK.

## JSX

Prax comes with an optional adapter for JSX compatibility and migrating React-based code. Requires a bit of wiring-up. Make a file with the following:

```js
import * as x from 'prax'
import {R} from 'prax/rcompat.mjs'

export {F} from 'prax/rcompat.mjs'
export function E(...args) {return R(x.E, ...args)}
export function S(...args) {return R(x.S, ...args)}
```

Configure your transpiler (Babel / Typescript / etc.) to use the "legacy" JSX transform, calling the resulting `E` for normal elements and `F` for fragments.

Unlike React, Prax can't use the same function for normal and SVG elements. Put all your SVG into a separate file, with a JSX pragma to use this special `S` function for that file.

Afterwards, the following should work:

```js
function Outer() {
  return <Inner class='one'>two</Inner>
}

function Inner({children, ...props}) {
  return <div {...props}>one {children} two</div>
}
```

## License

https://unlicense.org

## Misc

I'm receptive to suggestions. If this library _almost_ satisfies you but needs changes, open an issue or chat me up. Contacts: https://mitranim.com/#contacts
