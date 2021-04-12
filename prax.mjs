import * as f from 'fpx'

/* Public API */

export const e = E.bind.bind(E, undefined)

export function E(name, props, ...children) {
  const node = document.createElement(f.only(name, f.isStr), props)
  return reset(node, props, ...children)
}

export function reset(node, props, ...children) {
  resetProps(node, props)
  removeNodes(node)
  if (props) appendChild(node, props.children)
  appendChildren(node, children)
  return node
}

export function resetProps(node, props) {
  f.valid(node, isElement)
  f.eachVal(f.dict(props), setProp, node)
}

export function resetChildren(node, children) {
  removeNodes(node)
  appendChildren(node, children)
}

export function appendChildren(node, children) {
  if (f.isNil(children)) return
  for (const val of f.list(children)) appendChild(node, val)
}

export function cls(...vals) {
  return f.fold(vals, '', addClass)
}

export function countChildren(val) {
  if (f.isNil(val)) return 0
  if (f.isList(val)) return f.sumBy(val, countChildren)
  return 1
}

export function mapChildren(val, fun, ...args) {
  f.valid(fun, f.isFun)
  const acc = []
  mapChildrenIter(0, val, 0, acc, fun, ...args)
  return acc
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

export class Raw extends String {}

/* Internal Utils */

function removeNodes(node) {
  f.valid(node, isNode)
  while (node.firstChild) node.firstChild.remove()
  return node
}

function appendChild(node, val) {
  if      (f.isNil(val))  {}
  else if (val === '')    {}
  else if (isNode(val))   node.appendChild(val)
  else if (f.isList(val)) appendChildren(node, val)
  else if (f.isPrim(val)) node.appendChild(new Text(val))
  else                    appendChild(node, primValueOf(val))
}

// Should be kept in sync with `node.mjs` -> `encodeProp`.
// Expected to accumulate more special cases over time.
function setProp(val, key, node) {
  if      (key === 'children')   {}
  else if (key === 'attributes') setAttrs(node, val)
  else if (key === 'class')      setClass(node, val)
  else if (key === 'className')  setClass(node, val)
  else if (key === 'style')      setStyle(node, val)
  else if (key === 'dataset')    setDataset(node, val)
  else if (boolAttrs.has(key))   setAttr(val, key, node)
  else if (!isPropKey(key))      setAttr(val, key, node)
  else                           node[key] = val
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

  node.setAttribute(key, f.str(val))
}

function setClass(node, val) {
  node.className = maybeStr(val)
}

// Should be kept in sync with `node.mjs` -> `encodeStyle`.
function setStyle(node, val) {
  if (f.isDict(val)) f.eachVal(val, setStyleProp, node.style)
  else setAttr(val, 'style', node)
}

function setStyleProp(val, key, style) {
  if (f.isNil(val)) {
    // Must be `null`, not `undefined`.
    style[key] = null
    return
  }

  validAt(key, val, f.isStr)
  style[key] = val
}

function setDataset(node, val) {
  f.eachVal(f.dict(val), setDatasetProp, node.dataset)
}

function setDatasetProp(val, key, dataset) {
  if (f.isNil(val)) {
    delete dataset[key]
    return
  }

  validAt(key, val, f.isStr)
  dataset[key] = val
}

function addClass(acc, val) {
  if (f.isList(val)) return f.fold(val, acc, addClass)
  val = f.str(val)
  if (!val) return acc
  if (!acc) return val
  return `${acc} ${val}`
}

function isNode(val) {return f.isInst(val, Node)}
function isElement(val) {return f.isInst(val, Element)}

function validAt(key, val, fun) {
  if (!fun(val)) {
    throw Error(`invalid property "${key}": expected ${f.show(val)} to satisfy ${f.show(fun)}`)
  }
}

// Intentional divergence from the Node version: DOM APIs tend to have special
// support for `null` but not `undefined`.
function maybeStr(val) {
  return f.isNil(val) ? null : f.str(val)
}

function primValueOf(val) {
  if (f.isObj(val) && 'valueOf' in val) return f.prim(val.valueOf())
  throw Error(`can't convert ${f.show(val)} to primitive`)
}

function isPropKey(key) {return /^[a-z][\w]*$/.test(key)}

function mapChildrenIter(i, val, _i, acc, fun, ...args) {
  if (f.isNil(val)) return i
  if (f.isList(val)) return f.fold(val, i, mapChildrenIter, acc, fun, ...args)
  acc.push(fun(val, i, ...args))
  return i + 1
}
