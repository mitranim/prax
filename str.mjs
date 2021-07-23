/// <reference types="./str.d.ts" />
// See `impl.md` for implementation notes.

import {Raw, boolAttrs, voidElems} from './dom.mjs'

/* Public API */

export {Raw, boolAttrs, voidElems, cls, len, vac, map} from './dom.mjs'

export function E(name, props, ...children) {
  return new Raw(encodeHtml(name, props, children))
}

// TODO: this should use XML encoding, without HTML special cases.
export const S = E

export function F(...children) {
  return new Raw(encodeChildren(children))
}

// https://www.w3.org/TR/html52/syntax.html#escaping-a-string
export function escapeText(val) {
  val = str(val)
  return reText.test(val) ? val.replace(reText, escapeChar) : val
}

// https://www.w3.org/TR/html52/syntax.html#escaping-a-string
export function escapeAttr(val) {
  val = str(val)
  return reAttr.test(val) ? val.replace(reAttr, escapeChar) : val
}

export function doc(val) {
  return `<!doctype html>${encodeChild(val)}`
}

export const e = E.bind.bind(E, undefined)

/* Internal Utils */

function encodeHtml(name, props, children) {
  valid(name, isValidElemName)

  const open = `<${name}${encodeProps(props)}>`

  if (voidElems.has(name)) {
    if (children.length) {
      throw Error(`got unexpected children for void element "${name}"`)
    }
    return open
  }

  const innerHtml = toStr(props && props.innerHTML)
  const inner = encodeChildren(children)
  return `${open}${innerHtml}${inner}</${name}>`
}

function encodeChildren(val) {return foldArr(val, '', appendEncodeChild)}
function appendEncodeChild(acc, node) {return acc + encodeChild(node)}

function encodeChild(node) {
  if (isArr(node)) return encodeChildren(node)
  if (isInst(node, String)) return node
  return escapeText(toStr(node))
}

function encodeProps(props) {return foldDict(props, '', appendEncodeProp)}
function appendEncodeProp(acc, val, key) {return acc + encodeProp(key, val)}

// Should be kept in sync with `dom.mjs` -> `setProp`.
// Expected to accumulate more special cases over time.
// TODO: skip this for XML rendering.
function encodeProp(key, val) {
  if (key === 'children')     throw Error(`use {R} from 'prax/rcompat.mjs' for children-in-props`)
  if (key === 'attributes')   return encodeAttrs(val)
  if (key === 'class')        return attr('class', optStr(val))
  if (key === 'className')    return attr('class', optStr(val))
  if (key === 'style')        return encodeStyle(val)
  if (key === 'dataset')      return encodeDataset(val)
  if (key === 'httpEquiv')    return attr('http-equiv', val)
  if (key === 'htmlFor')      return attr('for', val)
  if (/^aria[A-Z]/.test(key)) return attr(toAria(key), val)
  if (key === 'innerHTML')    return ''
  return attr(key, val)
}

function encodeAttrs(attrs) {return foldDict(attrs, '', appendEncodeAttr)}
function appendEncodeAttr(acc, val, key) {return acc + attr(key, val)}

// Should be kept in sync with `dom.mjs` -> `setStyle`.
function encodeStyle(val) {
  if (isNil(val)) return ''
  if (isStr(val)) return val && attr('style', val)
  if (isDict(val)) return encodeStyle(foldDict(val, '', appendEncodeStyle))
  throw Error(`style must be string or dict, got ${show(val)}`)
}

function appendEncodeStyle(acc, val, key) {
  val = encodeStylePair(key, val)
  return acc && val ? `${acc} ${val}` : acc || val
}

// Might need smarter conversion from JS to CSS properties.
// Probably want to detect and reject unquoted `:;` in values.
function encodeStylePair(key, val) {
  if (isNil(val)) return ''
  validAt(key, val, isStr)
  return `${camelToKebab(key)}: ${val};`
}

function encodeDataset(dataset) {
  return foldDict(dataset, '', appendEncodeDataAttr)
}

function appendEncodeDataAttr(acc, val, key) {
  if (isNil(val)) return acc
  return acc + attr(`data-${camelToKebab(key)}`, toStr(val))
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
  valid(key, isValidAttrName)
  if (isNil(val)) return ``

  if (boolAttrs.has(key)) {
    validAt(key, val, isBool)
    return !val ? `` : ` ${key}=""`
  }

  validAt(key, val, isStringable)
  return ` ${key}="${escapeAttr(toStrUnchecked(val))}"`
}

// ARIA attributes appear to be case-insensitive, with only the `aria-` prefix
// containing a hyphen.
function toAria(key) {return `aria-${key.slice(4).toLowerCase()}`}

// Should match the browser algorithm for dataset keys.
// Probably very inefficient.
function camelToKebab(val) {
  valid(val, isStr)

  let out = ''
  for (const char of val) {
    const lower = char.toLowerCase()
    if (char !== lower) out += '-'
    out += lower
  }
  return out
}

const reText = /[&\u00a0<>]/g
const reAttr = /[&\u00a0"]/g

// https://www.w3.org/TR/html52/syntax.html#escaping-a-string
function escapeChar(char) {
  if (char === '&')      return '&amp;'
  if (char === '\u00a0') return '&nbsp;'
  if (char === '"')      return '&quot;'
  if (char === '<')      return '&lt;'
  if (char === '>')      return '&gt;'
  return char
}

// Extremely permissive. Should prevent common gotchas while not interfering
// with non-ASCII XML, which we do support.
//
// Reference for HTML:
// https://www.w3.org/TR/html52/syntax.html#tag-name
// https://www.w3.org/TR/html52/infrastructure.html#alphanumeric-ascii-characters
//
// Also see for attrs, unused:
// https://www.w3.org/TR/html52/syntax.html#elements-attributes
function isValidElemName(val) {return isStr(val) && /^[^\s<>"]+$/.test(val)}

// Extremely permissive. Intended only to prevent weird gotchas.
function isValidAttrName(val) {return /\S+/.test(val)}

function validAt(key, val, fun) {
  if (!fun(val)) {
    throw Error(`invalid property "${key}": expected ${show(val)} to satisfy ${show(fun)}`)
  }
}

function toStr(val) {return toStrUnchecked(valid(val, isStringable))}

// WTB shorter name.
function toStrUnchecked(val) {
  if (isNil(val)) return ''
  if (isStr(val)) return val
  if (isPrim(val)) return val.toString()
  return toStr(val.toString())
}

function isStringable(val) {return isPrim(val) || isStringableObj(val)}

function isStringableObj(val) {
  if (!isObj(val)) return false
  const {toString} = val
  return (
    isFun(toString) &&
    toString !== Object.prototype.toString &&
    toString !== Array.prototype.toString
  )
}

function foldArr(val, acc, fun) {
  for (let i = 0; i < val.length; i += 1) acc = fun(acc, val[i])
  return acc
}

function foldDict(val, acc, fun, ...args) {
  if (!isNil(val)) {
    valid(val, isDict)
    for (const key in val) acc = fun(acc, val[key], key, ...args)
  }
  return acc
}

function isNil(val) {return val == null}
function isBool(val) {return typeof val === 'boolean'}
function isStr(val) {return typeof val === 'string'}
function isPrim(val) {return !isComp(val)}
function isComp(val) {return isObj(val) || isFun(val)}
function isFun(val) {return typeof val === 'function'}
function isObj(val) {return val !== null && typeof val === 'object'}
function isArr(val) {return isInst(val, Array)}
function isDict(val) {return isObj(val) && Object.getPrototypeOf(val) === Object.prototype}
function isInst(val, Cls) {return isComp(val) && val instanceof Cls}

function str(val) {return isNil(val) ? '' : valid(val, isStr)}
function optStr(val) {return isNil(val) ? undefined : str(val)}

function valid(val, test) {
  if (!test(val)) throw Error(`expected ${show(val)} to satisfy test ${show(test)}`)
  return val
}

// Placeholder, might improve.
function show(val) {return (isFun(val) && val.name) || String(val)}
