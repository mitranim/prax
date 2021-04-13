import * as f from 'fpx'
import {Raw, boolAttrs, voidElems} from './prax.mjs'

/* Public API */

export {Raw, boolAttrs, voidElems, cls} from './prax.mjs'

export function E(name, props, ...children) {
  return new Raw(encodeHtml(name, props, children))
}

export const S = E

export function F(...children) {
  return new Raw(encodeChildren(children))
}

// https://www.w3.org/TR/html52/syntax.html#escaping-a-string
export function escapeText(val) {
  val = f.str(val)
  const reg = /[&\u00a0<>]/g
  return reg.test(val) ? val.replace(reg, escapeChar) : val
}

// https://www.w3.org/TR/html52/syntax.html#escaping-a-string
export function escapeAttr(val) {
  val = f.str(val)
  const reg = /[&\u00a0"]/g
  return reg.test(val) ? val.replace(reg, escapeChar) : val
}

export const e = E.bind.bind(E, undefined)

/* Internal Utils */

function encodeHtml(name, props, children) {
  f.valid(name, isValidElemName)

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
  if (f.isArr(node)) return encodeChildren(node)
  if (f.isInst(node, String)) return node
  return escapeText(toStr(node))
}

function encodeProps(props) {return foldDict(props, '', appendEncodeProp)}
function appendEncodeProp(acc, val, key) {return acc + encodeProp(key, val)}

// Should be kept in sync with `prax.mjs` -> `setProp`.
// Expected to accumulate more special cases over time.
// TODO: skip this for XML rendering.
function encodeProp(key, val) {
  if (key === 'children')     throw Error(`use {R} from 'prax/rcompat.mjs' for children-in-props`)
  if (key === 'attributes')   return encodeAttrs(val)
  if (key === 'class')        return attr('class', f.opt(val, f.isStr))
  if (key === 'className')    return attr('class', f.opt(val, f.isStr))
  if (key === 'style')        return encodeStyles(val)
  if (key === 'dataset')      return encodeDataset(val)
  if (key === 'httpEquiv')    return attr('http-equiv', val)
  if (/^aria[A-Z]/.test(key)) return attr(toAria(key), val)
  if (key === 'innerHTML')    return ''
  return attr(key, val)
}

function encodeAttrs(attrs) {return foldDict(attrs, '', appendEncodeAttr)}
function appendEncodeAttr(acc, val, key) {return acc + attr(key, val)}

// Should be kept in sync with `prax.mjs` -> `setStyle`.
function encodeStyles(val) {
  if (f.isNil(val)) return ''
  if (f.isStr(val)) return val && attr('style', val)
  if (f.isDict(val)) return encodeStyles(foldDict(val, '', appendEncodeStyle))
  throw Error(`style must be string or dict, got ${f.show(val)}`)
}

function appendEncodeStyle(acc, val, key) {
  val = encodeStylePair(key, val)
  return acc && val ? `${acc} ${val}` : acc || val
}

// Might need smarter conversion from JS to CSS properties.
// Probably want to detect and reject unquoted `:;` in values.
function encodeStylePair(key, val) {
  if (f.isNil(val)) return ''
  validAt(key, val, f.isStr)
  return `${camelToKebab(key)}: ${toStr(val)};`
}

function encodeDataset(dataset) {
  return foldDict(dataset, '', appendEncodeDataAttr)
}

function appendEncodeDataAttr(acc, val, key) {
  if (f.isNil(val)) return acc
  return acc + attr(`data-${camelToKebab(key)}`, toStr(val))
}

/*
Should be kept in sync with `prax.mjs` -> `setAttr`.

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
  f.valid(key, isValidAttrName)
  if (f.isNil(val)) return ``

  if (boolAttrs.has(key)) {
    validAt(key, val, f.isBool)
    return !val ? `` : ` ${key}=""`
  }

  return ` ${key}="${escapeAttr(toStr(val))}"`
}

// ARIA attributes appear to be case-insensitive, with only the `aria-` prefix
// containing a hyphen.
function toAria(key) {
  return `aria-${key.slice(4).toLowerCase()}`
}

// Should match the browser algorithm for dataset keys.
// Probably very inefficient.
function camelToKebab(val) {
  f.valid(val, f.isStr)

  let out = ''
  for (const char of val) {
    const lower = char.toLowerCase()
    if (char !== lower) out += '-'
    out += lower
  }
  return out
}

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
function isValidElemName(val) {return f.isStr(val) && /^[^\s<>"]+$/.test(val)}

// Extremely permissive. Intended only to prevent weird gotchas.
function isValidAttrName(val) {return /\S+/.test(val)}

function validAt(key, val, fun) {
  if (!fun(val)) {
    throw Error(`invalid property "${key}": expected ${f.show(val)} to satisfy ${f.show(fun)}`)
  }
}

function toStr(val) {
  if (f.isNil(val)) return ''
  if (f.isStr(val)) return val
  if (f.isPrim(val)) return val.toString()
  f.valid(val, isStringable)
  return toStr(val.toString())
}

function isStringable(val) {
  const {toString} = val
  return (
    f.isObj(val) &&
    f.isFun(toString) &&
    toString !== Object.prototype.toString &&
    toString !== Array.prototype.toString
  )
}

function foldArr(val, acc, fun, ...args) {
  if (!f.isNil(val)) {
    f.valid(val, f.isArr)
    for (let i = 0; i < val.length; i += 1) acc = fun(acc, val[i], i, ...args)
  }
  return acc
}

function foldDict(val, acc, fun, ...args) {
  if (!f.isNil(val)) {
    f.valid(val, f.isDict)
    for (const key in val) acc = fun(acc, val[key], key, ...args)
  }
  return acc
}
