import * as f from 'fpx'
import {boolAttrs} from './prax.mjs'

/* Public API */

export {cls} from './prax.mjs'

export const dom = false

export function E(type, props, ...nodes) {
  return new Raw(encodeHtml(type, props, nodes))
}

export class Raw extends String {}

export function encodeHtml(name, props, nodes) {
  return encodeXml(name, props, nodes, voidElems, boolAttrs)
}

export function encodeXml(name, props, nodes, vElems, bAttrs) {
  f.valid(name, isValidElementName)

  if (vElems) f.valid(vElems, isSet)
  if (bAttrs) f.valid(bAttrs, isSet)

  const open = `<${name}${encodeProps(props, bAttrs)}>`

  if (vElems && vElems.has(name)) {
    if (nodes.length) throw Error(`got unexpected child nodes for void element "${name}"`)
    return open
  }

  return `${open}${encodeNodes(nodes)}</${name}>`
}

// https://www.w3.org/TR/html52/syntax.html#escaping-a-string
export function escapeText(val) {
  return f.str(val).replace(/[&\u00a0<>]/g, escapeChar)
}

// https://www.w3.org/TR/html52/syntax.html#escaping-a-string
export function escapeAttr(val) {
  return f.str(val).replace(/[&\u00a0"]/g, escapeChar)
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

// https://www.w3.org/TR/html52/
// https://www.w3.org/TR/html52/syntax.html#writing-html-documents-elements
export const voidElems = new Set([
  'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta',
  'param', 'source', 'track', 'wbr',
])

/* Internal Utils */

function encodeNodes(nodes) {
  return f.fold(nodes, '', appendEncodeNode)
}

function appendEncodeNode(acc, node) {
  return acc + encodeNode(node)
}

function encodeNode(node) {
  if (f.isList(node)) return encodeNodes(node)
  if (f.isPrim(node)) return escapeText(encodePrim(node))
  return encodePrim(primValueOf(node))
}

function encodeProps(props, bAttrs) {
  return f.foldVals(f.dict(props), '', appendEncodeProp, bAttrs)
}

function appendEncodeProp(acc, val, key, bAttrs) {
  return acc + encodeProp(key, val, bAttrs)
}

// Should be kept in sync with `prax.mjs` -> `setProp`.
function encodeProp(key, val, bAttrs) {
  if (key === 'attributes')   return encodeAttrs(val, bAttrs)
  if (key === 'style')        return attr(key, encodeStyle(val), bAttrs)
  if (key === 'httpEquiv')    return attr('http-equiv', val, bAttrs)
  if (key === 'dataset')      return encodeDataset(val)
  if (/^aria[A-Z]/.test(key)) return attr(toAria(key), val, bAttrs)
  if (key === 'className')    useInstead(`class`,     `className`)
  if (key === 'styles')       useInstead(`style`,     `styles`)
  if (key === 'http-equiv')   useInstead(`httpEquiv`, `http-equiv`)
  if (/^data-/.test(key))     useInstead(`dataset`,   `data-*`)
  if (/^aria-/.test(key))     useInstead(`aria*`,     `aria-*`)
  return attr(key, val, bAttrs)
}

function encodeAttrs(attrs, bAttrs) {
  return f.foldVals(f.dict(attrs), '', appendEncodeAttr, bAttrs)
}

function appendEncodeAttr(acc, val, key, bAttrs) {
  return acc + attr(key, val, bAttrs)
}

// Should be kept in sync with `prax.mjs` -> `setStyle`.
function encodeStyle(val) {
  if (f.isDict(val)) return f.foldVals(val, '', appendEncodeStyle)
  return maybeStr(val)
}

function appendEncodeStyle(acc, val, key) {
  val = encodeStylePair(key, val)
  return acc && val ? `${acc}; ${val}` : acc || val
}

// Semi-placeholder.
// Might need smarter conversion from JS to CSS properties.
// Probably want to detect and reject unquoted `:;` in values.
function encodeStylePair(key, val) {
  if (f.isNil(val)) return ''
  validAt(key, val, f.isStr)
  return `${camelToKebab(key)}: ${val}`
}

function encodeDataset(dataset) {
  return f.foldVals(f.dict(dataset), '', appendEncodeDataAttr)
}

function appendEncodeDataAttr(acc, val, key, bAttrs) {
  return acc + attr(`data-${camelToKebab(key)}`, val, bAttrs)
}

// Should be kept in sync with `prax.mjs` -> `setAttr`.
function attr(key, val, bAttrs) {
  f.valid(key, isValidAttrName)
  if (f.isNil(val)) return ``

  if (bAttrs && bAttrs.has(key)) {
    validAt(key, val, f.isBool)
    return !val ? `` : ` ${key}`
  }

  validAt(key, val, f.isStr)
  return !val ? ` ${key}` : ` ${key}="${escapeAttr(val)}"`
}

// ARIA attributes appear to be case-insensitive, with only the `aria-` prefix
// containing a hyphen.
function toAria(key) {
  return `aria-${key.slice(4).toLowerCase()}`
}

// Should match the browser algorithm for dataset keys.
// Probably inefficient.
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

// https://www.w3.org/TR/html52/syntax.html#tag-name
// https://www.w3.org/TR/html52/infrastructure.html#alphanumeric-ascii-characters
//
// Probably not compliant.
function isValidElementName(val) {
  return f.isStr(val) && /^[a-z][a-z0-9_-]*$/.test(val)
}

// https://www.w3.org/TR/html52/syntax.html#elements-attributes
//
// Probably not compliant.
function isValidAttrName(val) {
  return f.isStr(val) && /^(?:[a-z][a-z0-9_-]+:)?[^\s'">/=]+$/.test(val)
}

function validAt(key, val, fun) {
  if (!fun(val)) {
    throw Error(`invalid property "${key}": expected ${f.show(val)} to satisfy ${f.show(fun)}`)
  }
}

function maybeStr(val) {
  return f.isNil(val) ? undefined : f.str(val)
}

function encodePrim(val) {
  return f.isNil(val) ? '' : String(f.prim(val))
}

function primValueOf(val) {
  if (f.isObj(val) && 'valueOf' in val) return f.prim(val.valueOf())
  throw Error(`can't convert ${f.show(val)} to primitive`)
}

function isSet(val) {
  return f.isObj(val) && f.isFun(val.has)
}

function useInstead(good, bad) {
  throw Error(`use "${good}" instead of "${bad}"`)
}
