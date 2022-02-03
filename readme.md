## Overview

HTML/DOM rendering system for hybrid SSR + SPA apps. See [Why](#why). In short: performance and _radical_ simplicity.

* Markup = nested function calls.
* No intermediate representations.
  * Render directly to strings in Node/Deno.
  * Render directly to DOM nodes in browsers.
* No VDOM.
* No diffing (mostly).
* No library classes.
* No templates.
* No string parsing.
* Render only once. Use native [custom elements](https://developer.mozilla.org/en-US/docs/Web/Web_Components/Using_custom_elements) for state. (Custom elements don't need library support.)
* Replace instead of reflowing.
* Runs in [Node](https://nodejs.org/en/about/), [Deno](https://deno.land), and browsers.
* Nice-to-use in plain JS. No build system required.

Tiny (a few kilobytes unminified) and dependency-free. Native JS module.

## TOC

* [Why](#why)
  * [Why not React?](#why-not-react)
  * [Why not Svelte?](#why-not-svelte)
  * [Why not plain strings?](#why-not-plain-strings)
  * [Why not framework X?](#why-not-framework-x)
* [Usage](#usage)
* [API](#api)
  * [`E`](#etype-props-children)
  * [`S`](#stype-props-children)
  * [`F`](#fchildren)
  * [`reset`](#resetelem-props-children)
  * [`resetProps`](#resetpropselem-props)
  * [`replace`](#replacenode-children)
  * [`resetDoc`](#resetdochead-body)
  * [`resetHead`](#resetheadhead)
  * [`resetBody`](#resetbodybody)
  * [`resetText`](#resettextnode-src)
  * [`reg`](#regcls)
  * [`props`](#propsnode)
  * [`cls`](#clsvals)
  * [`len`](#lenchildren)
  * [`vac`](#vacchildren)
  * [`map`](#mapchildren-fun-args)
  * [`doc`](#docval)
  * [`merge`](#mergevals)
  * [`lax`](#laxval)
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

React seems _particularly unfit_ for hybrid SSR + SPA apps. Your ideal flow:

* On any request, render the _entire_ page in Node/Deno.
* The user gets the fully-built content. It has no JS placeholders, doesn't require any ajax, and doesn't contain invisible JSON.
* Load the same JS into the browser. Enable interactive components and pushstate links. No initial ajax.
* On pushstate transitions, fetch data and render pages entirely in the browser. The rendering code is fully isomorphic between Node/Deno and browsers.

If the entire page was rendered with React, then to activate the interactive parts, you must load all that JS and _re-render_ the entire page with React. In the browser. On a page that was already rendered. This is ludicrously wasteful. In my current company's app, this easily takes 500ms of CPU time on many pages (using Preact). To make it worse, because markup is a function of data (regardless of your rendering library), this requires the _original data_, which you must either invisibly inline into HTML (wasted traffic, SEO deranking), or re-fetch in the browser (wasted traffic, server load). This is insane.

For apps with SSR, a better approach is to activate interactive components in-place without any "render". Native custom elements are _particularly fit_ for this. This requires separating the _markup_ code from the _stateful behavior_ code. React is predicated on the idea of co-locating markup and state. You could still render your markup with React, but when markup is stateless, this is pointlessly inefficient. Prax can do it much faster, while optionally using JSX.

#### Slow

React's rendering model is _inefficient by design_. Svelte's creator did a better job explaining this: https://svelte.dev/blog/virtual-dom-is-pure-overhead.

The _design_ inefficiencies described above shouldn't apply to the initial page render in Node/Deno, when there's nothing to diff against. However, there are also needless _implementation_ inefficiencies. My benchmarks are for Preact, which we've been using over React for size reasons. At my current company, replacing `preact@10.5.13` and `preact-render-to-string@5.1.18` with the initial, naive and almost unoptimized Prax yields x5 better performance in Node, and somewhere between x3 and x8 (depending on how you measure) better in browsers, for rendering big pages. In addition, switching to custom elements for stateful components allows to completely eliminate the in-browser initial render, which would hitch the CPU for 500ms on some pages, while also eliminating the need to fetch or inline a huge amount of data that was required for that render.

Parts of the overhead weren't in Preact itself, but merely encouraged by it. In SSR, components would initialize state, create additional owned objects, bind callbacks, and establish implicit reactive subscriptions, even though this would all be wasted. This doesn't excuse an unfit model, and the performance improvement is real.

#### Large

By now React has bloated to what, 100+ KiB minified? More? Fortunately, Preact solves that (≈10 KiB minified at the time of writing). Prax is even smaller; a few kilobytes unminified, with no dependencies.

### Why not Svelte?

Svelte has similar design goals, but seems to require a build system, which automatically invalidates it for me. With native module support in browsers, you can _run from source_. Don't squander this.

Prax targets a particular breed of SSR+SPA apps, for which Svelte might be unfit. I haven't checked Svelte's server-rendering story. See the constraints outlined above.

### Why not plain strings?

For the application architecture espoused by Prax, it would be even simpler and faster to use strings, so why bother with Prax?

```js
`<div class="${cls}">${content}</div>`
```

* Prax provides an isomorphic API that renders to strings in Node/Deno, and to DOM nodes in browsers.
* Prax handles a myriad of HTML/XML gotchas, such as content escaping, nil tolerance, and various bug prevention measures.
* Prax is JSX-compatible, without any React gunk.
* Nested function calls are more syntactically precise/rich/powerful than a large string. Editors provide better support. Syntax errors are immediately found.
* Probably more.

### Why not framework X?

Probably never heard of X! For the very specific requirements outlined above, it was faster to build a fit, than to search among the thousands of unfits. If one already existed, let me know.

## Usage

With NPM:

```sh
npm i -E prax
```

With URL imports in Deno:

```js
import {E} from 'https://cdn.jsdelivr.net/npm/prax@0.7.10/str.mjs'
```

With URL imports in browsers:

```js
import {E} from 'https://cdn.jsdelivr.net/npm/prax@0.7.10/dom.mjs'
```

This example uses plain JS. Prax is also [compatible with JSX](#jsx). For a better experience, use native modules and run your app from source in both Node/Deno and browsers.

```js
import {E, doc} from 'prax'

function main() {
  const html = Html({title: 'home', body: Index()})
  console.log(html)
}

function Html({title, body}) {
  return doc(
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
/* @jsx E */

import {E, doc} from 'prax'

function main() {
  const html = Html({title: 'home', body: Index()})

  // In `str.mjs`, this is a string.
  // In `dom.mjs`, this is a DOM tree.
  console.log(html)
}

function Html({title, body}) {
  return doc(
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

Also see changelog: [changelog.md](changelog.md).

In Prax, rendering functions ([`E`](#etype-props-children)/[`S`](#stype-props-children)/[`F`](#fchildren)) return different output in Node/Deno and browsers. But you import and call them the same way. Prax provides the module `str.mjs` for Node/Deno, and the module `dom.mjs` for browsers. Its `package.json` specifies which file should be imported where, in ways understood by Node and bundlers such as Esbuild. You should be able to just:

```js
import {E} from 'prax'
import * as x from 'prax'
```

Also, you don't need a bundler! JS modules are natively supported by evergreen browsers. To avoid repeating the import URL, either list your dependencies in one module imported by the rest of the app, or use an importmap. Importmap support is [polyfillable](https://github.com/guybedford/es-module-shims). You can also use a bundler such as Esbuild _just_ for production builds.

```html
<script type="importmap">
  {"imports": {"prax": "/node_modules/prax/dom.mjs"}}
</script>
```

You might also need an importmap for Deno, to choose between `str.mjs` and `dom.mjs` depending on the environment.

### `E(type, props, ...children)`

Short for "element", abbreviated for frequent use. Renders an HTML element. In `str.mjs` returns a string, as `Raw` to indicate that it shouldn't be escaped. In `dom.mjs` returns a DOM node.

`type` must be a string. See [Props](#props) for props rules, and [Children](#children) for child rules.

```js
const node = E('div', {class: 'one'}, 'two')
console.log(node)

// `str.mjs`: [String (Raw): '<div class="one">two</div>']
// `dom.mjs`: <div class="one">two</div>
```

In browsers, `props` is passed to `document.createElement` as-is, in order to support creation of [customized built-in elements](https://developer.mozilla.org/en-US/docs/Web/API/CustomElementRegistry/define#customized_built-in_element) via `is`. Also see [Direct Instantiation](#direct-instantiation) for additional thoughts on this.

```js
class Btn extends HTMLButtonElement {}
customElements.define('a-btn', Btn, {extends: 'button'})

import {E} from 'prax'

// Works in Node/Deno and browsers. Creates a `Btn` in browsers.
E('button', {is: 'a-btn'})

// Equivalent to the above, but works only in browsers.
new Btn()
```

### `S(type, props, ...children)`

Exactly like [`E`](#etype-props-children), but generates SVG markup. In Node/Deno, either function will work, but in browsers, you _must_ use `S` for SVG. It uses `document.createElementNS` with the SVG namespace.

This is because unlike every template-based system, including React, Prax renders _immediately_. Nested function calls are evaluated inner-to-outer. When rendering an arbitrary element like `path` (there are many!), `E` has no way of knowing that it will eventually be included into `svg`. HTML parsers automate this because they parse _outer_ elements first.

```js
import {S} from 'prax'

function SomeIcon() {
  return S('svg', {class: 'my-icon'}, S('path', {}, '...'))
}
```

### `F(...children)`

Short for "fragment". Renders the children without an enclosing element. In `str.mjs`, this simply combines their markup without any wrappers or delimiters, and returns a string as `Raw`. In `dom.mjs`, this returns a [`DocumentFragment`](https://developer.mozilla.org/en-US/docs/Web/API/DocumentFragment).

You will rarely use this, because [`E`](#etype-props-children) supports arrays of children, nested to any depth. `F` is used internally by [`reset`](#resetelem-props-children).

### `reset(elem, props, ...children)`

(Browser-specific API, only in `dom.mjs`.)

Mutates the element, resetting it to the given props via [`resetProps`](#resetpropselem-props) and replacing its children; see [children rules](#children).

`reset` carefully avoids destroying existing content on render exceptions. It buffers children in a temporary `DocumentFragment`, replacing the previous children only when fully built.

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

### `resetProps(elem, props)`

(Browser-specific API, only in `dom.mjs`.)

Mutates the element, resetting its properties and attributes. Properties and attributes missing from `props` are not affected. To unset existing props, include them with the appropriate "zero value" (usually `null`/`undefined`).

Avoids reassigning properties when values are identical via `Object.is`. Many DOM properties are setters with side effects. This avoids unexpected costs.

```js
import * as x from 'prax'

x.resetProps(elem, {class: 'new-class', hidden: false})
```

### `replace(node, ...children)`

(Browser-specific API, only in `dom.mjs`.)

Shortcut for:

```js
import * as x from 'prax'

node.parentNode.replaceChild(x.F(...children), node)
```

### `resetDoc(head, body)`

(Browser-specific API, only in `dom.mjs`.)

Carefully updates the current `document.head` and `document.body`. Shortcut for using [`resetHead`](#resetheadhead) and [`resetBody`](#resetbodybody) together. Example:

```js
import * as x from 'prax'
import {E} from 'prax'

function SomePage() {
  x.resetDoc(
    E(`head`, {},
      E(`title`, {}, `some title`),
      E(`meta`, {name: `author`, content: `some author`}),
      E(`meta`, {name: `description`, content: `some description`}),
    ),
    E(`body`, {},
      E(`p`, {}, `hello world!`),
    )
  )
}
```

### `resetHead(head)`

(Browser-specific API, only in `dom.mjs`.)

Takes `HTMLHeadElement`, usually rendered with `E('head', ...)`, and carefully updates the current `document.head`. Rules:

  * _Doesn't affect nodes that weren't previously passed to `resetHead`_.
  * Instead of appending `<title>`, sets `document.title` to its text content.

Nodes previously passed to `resetHead` are tagged using a `WeakSet` which is exported under the name `metas` but undocumented. Adding other nodes to this set will cause Prax to replace them as well.

See [`resetDoc`](#resetdochead-body) for examples.

### `resetBody(body)`

(Browser-specific API, only in `dom.mjs`.)

Takes `HTMLBodyElement`, usually rendered with `E('body', ...)`, and replaces the current `document.body`, preserving focus if possible. See [`resetDoc`](#resetdochead-body) for examples.

### `resetText(node, src)`

(Browser-specific API, only in `dom.mjs`.)

Takes an `Element` and replaces its `textContent` by a stringified version of `src`, using Prax's [stringification rules](#stringable). Returns the given element. Very similar to the following:

```js
node.textContent = src
```

... but will _not_ render `[object Object]` or other similar garbage. See [rules](#stringable).

### `reg(cls)`

(Browser-specific API, only in `dom.mjs`.)

Short for "register". Registers a custom DOM element class, automatically deriving tag name from class name, and inspecting the prototype chain to automatically determine the base tag for the `{extends}` option. Incompatible with name-mangling minifiers. When using a bundler/minifier, it must be configured to preserve class names.

The following examples are equivalent:

```js
class Link extends HTMLAnchorElement {}
x.reg(Link)
```

```js
class Link extends HTMLAnchorElement {}
customElements.define(`a-link`, Link, {extends: `a`})
```

### `props(node)`

(Browser-specific API, only in `dom.mjs`.)

Takes an `Element` and returns _very approximate_ source props derived _only from attributes_.

```js
x.props(E('div', {class: 'one', dataset: {two: 'three'}}))
// {dataset: DOMStringMap{two: "three"}, class: "one"}
```

### `cls(...vals)`

Combines multiple CSS classes:

* Ignores falsy values (nil, `''`, `false`, `0`, `NaN`).
* Recursively traverses arrays.
* Combines strings, space-separated.

```js
x.cls('one', ['two'], false, 0, null, [['three']])
// 'one two three'
```

### `len(children)`

Analog of `React.Children.count`. Counts non-nil children, recursively traversing arrays.

```js
const children = ['one', null, [['two'], null]]
x.len(children)
// 2
```

### `vac(children)`

The name is short for "vacate" / "vacuum" / "vacuous". Same as `len(children) ? children : undefined`, but more efficient.

```js
x.vac(null)
// undefined

x.vac([[[null]]])
// undefined

x.vac([null, 0, 'str'])
// [null, 0, 'str']
```

This function allows to use `&&` without accidentally rendering a falsy value such as `false` or `0`. Without `x.vac`, `&&` may evaluate to something not intended for rendering.

```js
x.vac(someValue) && E(`div`, {}, someValue)
```

### `map(children, fun, ...args)`

where `fun` is `ƒ(child, i, ...args)`

Analog of `React.Children.map`. Flatmaps `children` via `fun`, returning the resulting array. Ignores nils and recursively traverses arrays.

```js
const children = ['one', null, [['two'], null]]
function fun(...args) {return args}
x.map(children, fun, 'bonus')
// [['one', 0, 'bonus'], ['two', 1, 'bonus']]
```

### `doc(val)`

Shortcut for prepending [`<!doctype html>`](https://developer.mozilla.org/en-US/docs/Glossary/Doctype).

  * In `str.mjs`, this encodes `val` using the [children](#children) rules, prepends doctype, and returns a plain string, which may be served over HTTP, written to a file, etc.
  * In `dom.mjs`, this simply returns `val`. Provided for isomorphism.

```js
import {E, doc} from 'prax'

function onRequest(req, res) {
  res.end(Html())
}

function Html() {
  return doc(
    E('html', {},
      E('head'),
      E('body'),
    )
  )
}
```

### `merge(...vals)`

Combines multiple [props](#props) into one, merging their `attributes`, `dataset`, `style`, `class`, `className` whenever possible. For other properties, this performs an override rather than merge (last value wins). In case of `style`, merging is done only for style dicts, not for style strings.

```js
import * as x from 'prax'

x.merge({class: `one`, onclick: someFunc}, {class: `two`, disabled: true})
// {class: `one two`, onclick: someFunc, disabled: true}
```

### `lax(val)`

Toggles lax/strict mode, which affects Prax's [stringification rules](#stringable). This is a combined getter/setter:

```js
import * as x from 'prax'

x.lax()      // false
x.lax(true)  // true
x.lax()      // true
x.lax(false) // false
x.lax()      // false
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

* `escapeText` (only `str.mjs`)
* `escapeAttr` (only `str.mjs`)
* `boolAttrs`
* `voidElems`
* `Raw`

### React Compat

The optional module `rcompat.mjs` exports a few functions for JSX compatibility and migrating code from React. See the section [JSX](#jsx) for usage examples.

* `R`
* `F` (different one!)

## Imperative, Synchronous

Imperative control flow and immediate, synchronous side effects are precious things. Don't squander them carelessly.

In Prax, everything is immediate. Rendering exceptions can be caught via `try/catch`. Magic context can be setup trivially in user code, via `try/finally`, without library support. Lifecycle stages such as "before render" and "after DOM mounting" can be done just by placing lines of code before and after a [`reset`](#resetelem-props-children) call. (Also via native lifecycle callbacks in custom elements, which doesn't require library support.)

Compare the hacks and workarounds invented in React to implement the same trivial things.

## Direct Instantiation

Unlike most "modern" rendering libraries, Prax doesn't stand between you and DOM elements. Functions such as [`E`](#etype-props-children) are trivial shortcuts for `document.createElement`. This has nice knock-on effects for [custom elements](https://developer.mozilla.org/en-US/docs/Web/Web_Components/Using_custom_elements).

Isomorphic code that runs in Node/Deno and browsers must use `E`, because on the server you always render to a string. However, code that runs _only_ in the browser is free to use direct instantiation, with custom constructor signatures.

The following example is a trivial custom element that takes an observable object and displays one of its properties as text. Subscription and unsubscription is automatic. (Observable signature approximated from [Espo → `isObs`](https://github.com/mitranim/espo).)

You can simply `new RecText(obs)`, passing a specific observable. No "props" involved in this. No weird library gotchas to deal with. When using TS or Flow, signatures can be properly typed, without hacks and workarounds such as "prop types".

```js
import {E, reset} from 'prax'

function SomeMarkup() {
  return new RecText(someObservable, {class: 'text'})
}

class RecText extends HTMLElement {
  constructor(observable, props) {
    super()
    this.obs = observable
    x.resetProps(this, props)
  }

  connectedCallback() {
    this.obs.sub(this)
    this.trig()
  }

  disconnectedCallback() {
    this.obs.unsub(this)
  }

  trig() {
    this.textContent = this.obs.val
  }
}
customElements.define('a-rec-text', RecText)
```

## Props

Just like React, Prax conflates attributes and properties, calling everything "props". Here are the rules.

* The term `nil` stands for both `null` and `undefined`.
* Props as a whole are `nil | {}`.
* Any prop with a `nil` value is either unset or skipped, as appropriate.
* [`class`](https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/class) and [`className`](https://developer.mozilla.org/en-US/docs/Web/API/Element/className) are both supported, as `nil | string`.
* [`attributes`](https://developer.mozilla.org/en-US/docs/Web/API/Element/attributes) is `nil | {}`. Every key-value is assumed to be an attribute, even in browsers, and follows the normal attribute assignment rules; see below.
* [`style`](https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/style) is `nil | string | {}`. If `{}`, it must have `camelCase` keys, matching the structure of a [`CSSStyleDeclaration`](https://developer.mozilla.org/en-US/docs/Web/API/CSSStyleDeclaration) object. Values are `nil | string`.
* [`dataset`](https://developer.mozilla.org/en-US/docs/Web/API/HTMLOrForeignElement/dataset) must be `nil | {}`, where keys are `camelCase` without the `data-` prefix. Values follow the attribute encoding rules. In `str.mjs`, `dataset` is converted to [`data-*`](https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/data-*) attributes. You can also just use those attributes.
* [`innerHTML`](https://developer.mozilla.org/en-US/docs/Web/API/Element/innerHTML) works in both environments, and must be `nil | string`.
* [`for`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/label#attr-for) and [`htmlFor`](https://developer.mozilla.org/en-US/docs/Web/API/HTMLLabelElement/htmlFor) both work, and must be `nil | string`.
* ARIA properties such as [`ariaCurrent`](https://developer.mozilla.org/en-US/docs/Web/API/Element/ariaCurrent) work in both environments, and must be `nil | string`. In `str.mjs`, they're converted to kebab-cased `aria-*` attributes. You can use both property names and attribute names.
* The value of any attribute, or a DOM property whose type is known to be `string`, must be either `nil` or [stringable](#stringable).

Additional environment-specific rules:

* In `str.mjs`, everything non-special-cased is assumed to be an attribute, and must be `nil` or [stringable](#stringable).
* In `dom.mjs`, there's a heuristic for deciding whether to assign a property or attribute. Prax will try to default to properties, but use attributes as a fallback for properties that are completely unknown or whose value doesn't match the type expected by the DOM.

Unlike React, Prax has _no made-up properties_ or weird renamings. Use `autocomplete` rather than `autoComplete`, `oninput` rather than `onChange`, and so on.

## Children

All rendering functions, such as [`E`](#etype-props-children) or [`reset`](#resetelem-props-children), take `...children` as [rest parameters](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/rest_parameters) and follow the same rules:

* Nil (`null` or `undefined`) is ignored.
* `''` is also ignored (doesn't create a `Text` node).
* `[]` is traversed, recursively if needed. The following are all equivalent: `a, b, c` | `[a, b, c]` | `[[a], [[[b, [[c]]]]]]`.
* As a consequence of the previous rules, `[null, [undefined]]` is the same as no children at all.
* Other primitives (numbers, bools, symbols) are stringified.
* `new Raw` strings are considered "inner HTML". In `str.mjs`, their content is included verbatim and not escaped. In `dom.mjs`, their content is parsed into DOM nodes, similarly to `innerHTML`.
* Anything else must be a [stringable object](#stringable).

In `str.mjs`, _after_ resolving all these rules, the output string is escaped, following [standard rules](https://www.w3.org/TR/html52/syntax.html#escaping-a-string). The only exception is `new Raw` strings, which are verbatim.

Caution: literal content of `script` elements may require additional escaping when it contains `</script>` inside strings, regexps, and so on. The following example generates broken markup, and will display a visible `')`. Prax currently doesn't escape this automatically.

```js
E('script', {}, new Raw(`console.log('</script>')`))
```

```html
<script>console.log('</script>')</script>
```

## Stringable

Prax's stringification rules are carefully designed to minimize gotchas and bugs.

* `null` and `undefined` are equivalent to `''`.
* Other primitives are stringified. (For example, `0` → `'0'`, `false` → `'false'`, `NaN` → `'NaN'`.)
* Objects without a custom `.toString` method are verboten. This includes `{}` and a variety of other classes. This is a bug prevention measure: the vast majority of such objects are never intended for rendering, and are only passed accidentally.
  * When `lax(false)` (default, recommended for development), non-stringable objects cause exceptions.
  * When `lax(true)` (recommended for production), non-stringable objects are treated as nil.
  * See the [`lax`](#laxval) function.
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
