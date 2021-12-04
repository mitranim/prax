/// <reference types="./str.d.ts" />
// See `impl.md` for implementation notes.

import * as d from './dom.mjs'

/* Public API */

export {Raw, boolAttrs, voidElems, cls, len, vac, map, merge, lax} from './dom.mjs'

export function E(name, props, ...children) {
  return new d.Raw(encodeHtml(name, props, children))
}

// TODO: this should use XML encoding, without HTML special cases.
export const S = E

export function F(...vals) {return new d.Raw(encodeChildren(vals))}

// https://www.w3.org/TR/html52/syntax.html#escaping-a-string
export function escapeText(val) {
  val = d.str(val)
  const re = /[\u00a0&<>]/g
  return re.test(val) ? val.replace(re, escapeChar) : val
}

// https://www.w3.org/TR/html52/syntax.html#escaping-a-string
export function escapeAttr(val) {
  val = d.str(val)
  const re = /[\u00a0&"]/g
  return re.test(val) ? val.replace(re, escapeChar) : val
}

export function doc(val) {return `<!doctype html>${encodeChild(val)}`}
export function e(...args) {return E.bind(undefined, ...args)}

/* Internal Utils */

function encodeHtml(name, props, children) {
  d.req(name, isValidElemName)

  const open = `<${name}${encodeProps(props)}>`

  if (d.voidElems.has(name)) {
    if (children.length) {
      throw Error(`got unexpected children for void element "${name}"`)
    }
    return open
  }

  const innerHtml = d.toStr(props && props.innerHTML)
  const inner = encodeChildren(children)
  return `${open}${innerHtml}${inner}</${name}>`
}

function encodeChildren(val) {return d.fold(val, ``, appendEncodeChild)}
function appendEncodeChild(acc, node) {return acc + encodeChild(node)}

function encodeChild(node) {
  if (d.isSeq(node)) return encodeChildren(node)
  if (d.isInst(node, d.Raw)) return node
  return escapeText(d.toStr(node))
}

function encodeProps(props) {return foldStruct(props, ``, appendEncodeProp)}
function appendEncodeProp(acc, val, key) {return acc + encodeProp(key, val)}

// Should be kept in sync with `dom.mjs` -> `setProp`.
// Expected to accumulate more special cases over time.
// TODO: skip this for XML rendering.
function encodeProp(key, val) {
  if (key === `children`)     throw Error(`use {R} from 'prax/rcompat.mjs' for children-in-props`)
  if (key === `attributes`)   return encodeAttrs(val)
  if (key === `class`)        return attr(`class`, d.optStr(val))
  if (key === `className`)    return attr(`class`, d.optStr(val))
  if (key === `style`)        return encodeStyle(val)
  if (key === `dataset`)      return encodeDataset(val)
  if (key === `httpEquiv`)    return attr(`http-equiv`, val)
  if (key === `htmlFor`)      return attr(`for`, val)
  if (/^aria[A-Z]/.test(key)) return attr(toAria(key), val)
  if (key === `innerHTML`)    return ``
  return attr(key, val)
}

function encodeAttrs(attrs) {return foldStruct(attrs, ``, appendEncodeAttr)}
function appendEncodeAttr(acc, val, key) {return acc + attr(key, val)}

// Should be kept in sync with `dom.mjs` -> `setStyle`.
function encodeStyle(val) {
  if (d.isNil(val)) return ``
  if (d.isString(val)) return val && attr(`style`, val)
  if (d.isStruct(val)) return encodeStyle(foldStruct(val, ``, appendEncodeStyle))
  throw TypeError(`style must be string or dict, got ${d.show(val)}`)
}

function appendEncodeStyle(acc, val, key) {
  val = encodeStylePair(key, val)
  return acc && val ? `${acc} ${val}` : acc || val
}

// Might need smarter conversion from JS to CSS properties.
// Probably want to detect and reject unquoted `:;` in values.
function encodeStylePair(key, val) {
  if (d.isNil(val)) return ``
  d.reqAt(key, val, d.isString)
  return `${cached(styleKeys, key, d.camelToKebab)}: ${val};`
}

function encodeDataset(dataset) {return foldStruct(dataset, ``, appendEncodeDataAttr)}

function appendEncodeDataAttr(acc, val, key) {
  if (d.isNil(val)) return acc
  return acc + attr(cached(dataKeys, key, camelToDataKey), d.toStr(val))
}

/*
Should be kept in sync with `dom.mjs` -> `setAttr`.

The HTML specification permits empty attrs without `=""`:

> https://www.w3.org/TR/html52/syntax.html#elements-attributes
> Empty attribute syntax
> Just the attribute name. The value is implicitly the empty string.

However, this is not permitted in XML which we aim to support, and some
ostensibly HTML-specific tools, like the `tidy` pretty-printer, balk and barf
at such ostentatious notions! In addition, browsers tend to serialize the
`=""`. We follow their lead for consistency.
*/
function attr(key, val) {
  d.req(key, isValidAttrName)
  if (d.isNil(val)) return ``

  if (d.boolAttrs.has(key)) {
    d.reqAt(key, val, d.isBool)
    return !val ? `` : ` ${key}=""`
  }

  val = d.toMaybeStr(val)
  if (d.isNil(val)) return ``
  return ` ${key}="${escapeAttr(val)}"`
}

// ARIA attributes appear to be case-insensitive. Only the `aria-` prefix
// contains a hyphen.
function toAria(key) {return `aria-${key.slice(4).toLowerCase()}`}

// Average cost: single digit ns.
export function cached(map, val, fun) {
  if (!map.has(val)) map.set(val, fun(val))
  return map.get(val)
}

export const styleKeys = new Map()
export const dataKeys = new Map()

// Reference: https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/dataset#name_conversion
export function camelToDataKey(val) {
  return `data-` + (/^[A-Z]/.test(val) ? `-` : ``) + d.camelToKebab(val)
}

// https://www.w3.org/TR/html52/syntax.html#escaping-a-string
export function escapeChar(char) {
  if (char === `&`) return `&amp;`
  if (char === `\u00a0`) return `&nbsp;`
  if (char === `"`) return `&quot;`
  if (char === `<`) return `&lt;`
  if (char === `>`) return `&gt;`
  return char
}

/*
Extremely permissive. Should prevent stupid errors without interfering with
non-ASCII XML, which we do support.

Reference for HTML:

  https://www.w3.org/TR/html52/syntax.html#tag-name
  https://www.w3.org/TR/html52/infrastructure.html#alphanumeric-ascii-characters

Also see for attrs, unused:
https://www.w3.org/TR/html52/syntax.html#elements-attributes
*/
function isValidElemName(val) {return d.isString(val) && /^[^\s<>"]+$/.test(val)}

// Extremely permissive. Intended only to prevent stupid errors.
function isValidAttrName(val) {return /\S+/.test(val)}

function foldStruct(val, acc, fun, ...args) {
  if (!d.isNil(val)) {
    d.req(val, d.isStruct)
    for (const key in val) acc = fun(acc, val[key], key, ...args)
  }
  return acc
}
