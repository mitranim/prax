import * as f from 'fpx'
import {boolAttrs} from './prax.mjs'

/* Public API */

export {cls, boolAttrs} from './prax.mjs'

export const e = E.bind.bind(E, undefined)

export function E(name, props, ...nodes) {
  return new Raw(encodeHtml(name, props, nodes))
}

export function X(name, props, ...nodes) {
  return new Raw(encodeXml(name, props, nodes))
}

export function encodeHtml(name, props, nodes) {
  return encodeXml(name, props, nodes, voidElems, boolAttrs)
}

export function encodeXml(name, props, nodes, vElems, bAttrs) {
  f.valid(name, isValidElementName)
  if (vElems) f.valid(vElems, isSet)
  if (bAttrs) f.valid(bAttrs, isSet)

  const open = `<${name}${encodeProps(props, bAttrs)}>`

  if (vElems && vElems.has(name)) {
    if (!f.isNil(nodes) && nodes.length) {
      throw Error(`got unexpected child nodes for void element "${name}"`)
    }
    return open
  }

  return `${open}${encodeNodes(nodes)}</${name}>`
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

// https://www.w3.org/TR/html52/
// https://www.w3.org/TR/html52/syntax.html#writing-html-documents-elements
export const voidElems = new Set([
  'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta',
  'param', 'source', 'track', 'wbr',
])

export class Raw extends String {}

/* Internal Utils */

function encodeNodes(nodes) {
  return foldArr(nodes, '', appendEncodeNode)
}

function appendEncodeNode(acc, node) {
  return acc + encodeNode(node)
}

function encodeNode(node) {
  if (f.isArr(node)) return encodeNodes(node)
  if (f.isStr(node)) return escapeText(node)
  return encodePrim(primValueOf(node))
}

function encodeProps(props, bAttrs) {
  return foldDict(props, '', appendEncodeProp, bAttrs)
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
  return foldDict(attrs, '', appendEncodeAttr, bAttrs)
}

function appendEncodeAttr(acc, val, key, bAttrs) {
  return acc + attr(key, val, bAttrs)
}

// Should be kept in sync with `prax.mjs` -> `setStyle`.
function encodeStyle(val) {
  if (f.isDict(val)) return foldDict(val, '', appendEncodeStyle)
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
  return foldDict(dataset, '', appendEncodeDataAttr)
}

function appendEncodeDataAttr(acc, val, key) {
  return acc + attr(`data-${camelToKebab(key)}`, val)
}

// Should be kept in sync with `prax.mjs` -> `setAttr`.
function attr(key, val, bAttrs) {
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
function isValidElementName(val) {
  return f.isStr(val) && /^[^\s<>"]+$/.test(val)
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
  if (f.isObj(val) && 'valueOf' in val) val = val.valueOf()
  if (f.isPrim(val)) return val
  throw Error(`can't convert ${f.show(val)} to primitive`)
}

function isSet(val) {
  return f.isObj(val) && f.isFun(val.has)
}

function useInstead(good, bad) {
  throw Error(`use "${good}" instead of "${bad}"`)
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
