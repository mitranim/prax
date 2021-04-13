import * as f from 'fpx'

/* Public API */

export function E(name, props, ...children) {
  elemValid(name, children)
  const node = document.createElement(name, props)
  return initNode(node, props, children)
}

export function S(name, props, ...children) {
  f.valid(name, f.isStr)
  const node = document.createElementNS(`http://www.w3.org/2000/svg`, name, props)
  return initNode(node, props, children)
}

export function F(...children) {
  return appendChildren(new DocumentFragment(), children)
}

export function reset(node, props, ...children) {
  f.isInst(node, Element)
  resetProps(node, props)
  return resetChildren(node, children)
}

export function cls(...vals) {
  return f.fold(vals, '', addClass)
}

// The specification postulates the concept, but where's the standard list?
// Taken from non-authoritative sources.
//
// https://www.w3.org/TR/html52/infrastructure.html#boolean-attribute
export const boolAttrs = new Set([
  'allowfullscreen', 'allowpaymentrequest', 'async',    'autofocus',
  'autoplay',        'checked',             'controls', 'default',
  'disabled',        'formnovalidate',      'hidden',   'ismap',
  'itemscope',       'loop',                'multiple', 'muted',
  'nomodule',        'novalidate',          'open',     'playsinline',
  'readonly',        'required',            'reversed', 'selected',
  'truespeed',
])

// https://www.w3.org/TR/html52/
// https://www.w3.org/TR/html52/syntax.html#writing-html-documents-elements
export const voidElems = new Set([
  'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta',
  'param', 'source', 'track', 'wbr',
])

export class Raw extends String {}

export const e = E.bind.bind(E, undefined)

/* Internal Utils */

function initNode(node, props, children) {
  resetProps(node, props)
  return appendChildren(node, children)
}

function resetProps(node, props) {
  f.eachVal(f.dict(props), setProp, node)
}

// See `impl.md`.
function resetChildren(node, children) {
  const frag = F(...children)
  removeNodes(node)
  node.append(frag)
  return node
}

function removeNodes(node) {
  f.isInst(node, Node)
  while (node.firstChild) node.firstChild.remove()
}

function appendChildren(node, children) {
  if (children.length) for (const val of children) appendChild(node, val)
  return node
}

function appendChild(node, val) {
  if (f.isNil(val))          return
  if (val === '')            return
  if (f.isInst(val, Node))   return void node.append(val)
  if (f.isInst(val, String)) return void appendRawChild(node, val)
  if (f.isList(val))         return void appendChildren(node, val)
  node.append(toStr(val))
}

// Inefficient. There are better solutions, but let's benchmark first.
function appendRawChild(node, val) {
  const clone = node.cloneNode()
  clone.innerHTML = val
  appendChildren(node, clone.childNodes)
}

// Should be kept in sync with `node.mjs` -> `encodeProp`.
// Expected to accumulate more special cases over time.
function setProp(val, key, node) {
  if (key === 'children')   throw Error(`use {R} from 'prax/rcompat.mjs' for children-in-props`)
  if (key === 'attributes') return void setAttrs(node, val)
  if (key === 'class')      return void setClass(node, normStr(val))
  if (key === 'className')  return void setClass(node, normStr(val))
  if (key === 'style')      return void setStyle(node, val)
  if (key === 'dataset')    return void setDataset(node, val)
  if (boolAttrs.has(key))   return void setAttr(val, key, node)
  setUnknownProp(node, key, val)
}

// Careful balancing act: minimizing gotchas AND special-case knowledge. Likely
// to get revised many, many times.
function setUnknownProp(node, key, val) {
  if (key in node) {
    const prev = node[key]
    if (f.isNil(prev) || f.isFun(prev)) {
      node[key] = normNil(val)
      return
    }

    if (f.isStr(prev)) {
      node[key] = toStr(val)
      return
    }

    if (f.isPrim(prev)) {
      if (!f.isPrim(val)) throw Error(`can't set non-primitive "${key}": ${f.show(val)} on ${node}`)
      node[key] = val
      return
    }
  }

  setAttr(val, key, node)
}

function setAttrs(node, attrs) {
  f.eachVal(f.dict(attrs), setAttr, node)
}

// Should be kept in sync with `node.mjs` -> `attr`.
function setAttr(val, key, node) {
  f.valid(key, f.isStr)

  if (f.isNil(val)) {
    node.removeAttribute(key)
    return
  }

  if (boolAttrs.has(key)) {
    validAt(key, val, f.isBool)
    if (val) node.setAttribute(key, '')
    else node.removeAttribute(key)
    return
  }

  node.setAttribute(key, toStr(val))
}

// Attr over `.className` for SVG compatibility. Might revise.
function setClass(node, val) {
  node.setAttribute('class', toStr(val))
}

// Should be kept in sync with `node.mjs` -> `encodeStyle`.
function setStyle(node, val) {
  if (f.isNil(val) || f.isStr(val)) return setAttr(val, 'style', node)
  if (f.isDict(val)) return f.eachVal(val, setStyleProp, node.style)
  throw Error(`style must be string or dict, got ${f.show(val)}`)
}

function setStyleProp(val, key, style) {
  val = normNil(val)
  if (f.isNil(val)) return void (style[key] = val)
  validAt(key, val, f.isStr)
  style[key] = val
}

function setDataset(node, val) {
  f.eachVal(f.dict(val), setDatasetProp, node.dataset)
}

function setDatasetProp(val, key, dataset) {
  if (f.isNil(val)) delete dataset[key]
  else dataset[key] = toStr(val)
}

function addClass(acc, val) {
  if (f.isList(val)) return f.fold(val, acc, addClass)
  val = f.str(val)
  if (!val) return acc
  if (!acc) return val
  return `${acc} ${val}`
}

function validAt(key, val, fun) {
  if (!fun(val)) {
    throw Error(`invalid property "${key}": expected ${f.show(val)} to satisfy ${f.show(fun)}`)
  }
}

// See `impl.md` on void elems.
function elemValid(name, children) {
  f.valid(name, f.isStr)
  if (children.length && voidElems.has(name)) {
    throw Error(`got unexpected children for void element "${name}"`)
  }
}

// Many DOM APIs consider only `null` to be nil.
function normNil(val) {return val === undefined ? null : val}
function normStr(val) {return f.isNil(val) ? null : f.str(val)}

function toStr(val) {
  if (f.isNil(val)) return ''
  if (f.isStr(val)) return val
  if (f.isPrim(val)) return val.toString()
  f.valid(val, isStringableObj)
  return toStr(val.toString())
}

function isStringableObj(val) {
  const {toString} = val
  return (
    f.isObj(val) &&
    f.isFun(toString) &&
    toString !== Object.prototype.toString &&
    toString !== Array.prototype.toString
  )
}
