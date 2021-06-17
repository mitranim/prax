// See `impl.md` for implementation notes.

/* Public API */

export function E(name, props, ...children) {
  elemValid(name, children)
  const node = document.createElement(name, props)
  return initNode(node, props, children)
}

export function S(name, props, ...children) {
  valid(name, isStr)
  const node = document.createElementNS(`http://www.w3.org/2000/svg`, name, props)
  return initNode(node, props, children)
}

export function F(...children) {
  return appendChildren(new DocumentFragment(), children)
}

export function reset(node, props, ...children) {
  resetProps(node, props)
  return resetChildren(node, children)
}

export function resetProps(node, props) {
  validInst(node, Element)
  eachVal(props, setProp, node)
  return node
}

export function replace(node, ...children) {
  node.parentNode.replaceChild(F(...children), node)
}

export function cls(...vals) {
  return fold(vals, '', addClass)
}

export function len(val) {
  return isNil(val) ? 0 : isArr(val) ? sumBy(val, len) : 1
}

export function map(val, fun, ...args) {
  valid(fun, isFun)
  const acc = []
  mapMutDeep(0, val, 0, acc, fun, ...args)
  return acc
}

// Shim for isomorphism with `str.mjs`.
export function doc(val) {return val}

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

// Makes user code more explicit/intentional. In reality, any `new String`
// object serves as a "raw" marker.
export class Raw extends String {}

export const e = E.bind.bind(E, undefined)

/* Internal Utils */

function initNode(node, props, children) {
  resetProps(node, props)
  return appendChildren(node, children)
}

// See `impl.md`.
function resetChildren(node, children) {
  const frag = F(...children)
  removeNodes(node)
  node.append(frag)
  return node
}

function removeNodes(node) {
  validInst(node, Node)
  while (node.firstChild) node.firstChild.remove()
}

function appendChildren(node, children) {
  children.forEach(appendChildTo, node)
  return node
}

function appendChildTo(child) {appendChild(this, child)}

function appendChild(node, val) {
  if (isNil(val))          return
  if (val === '')          return
  if (isInst(val, Node))   return void node.append(val)
  if (isInst(val, String)) return void appendRawChild(node, val)
  if (isArr(val))          return void appendChildren(node, val)
  node.append(toStr(val))
}

// Probably inefficient. Might be better solutions, but let's benchmark first.
function appendRawChild(node, val) {
  const clone = node.cloneNode()
  clone.innerHTML = val
  while (clone.firstChild) node.append(clone.firstChild)
}

// Should be kept in sync with `str.mjs` -> `encodeProp`.
// Expected to accumulate more special cases over time.
function setProp(val, key, node) {
  if (key === 'children')   throw Error(`use {R} from 'prax/rcompat.mjs' for children-in-props`)
  if (key === 'is')         return undefined
  if (key === 'attributes') return void setAttrs(node, val)
  if (key === 'class')      return void setClass(node, normStr(val))
  if (key === 'className')  return void setClass(node, normStr(val))
  if (key === 'style')      return void setStyle(node, val)
  if (key === 'dataset')    return void setDataset(node, val)

  // Careful balancing act: minimizing gotchas AND special-case knowledge. Likely
  // to get revised many, many times. Also likely one of the bottlenecks.
  if (key in node) {
    const prev = node[key]
    if (isNil(prev) || isFun(prev)) {
      maybeSetProp(node, key, prev, normNil(val))
      return
    }

    if (isStr(prev)) {
      maybeSetProp(node, key, prev, toStr(val))
      return
    }

    if (isPrim(prev)) {
      if (!isPrim(val)) throw Error(`can't set non-primitive "${show(key)}": ${show(val)} on ${show(node)}`)
      if (!isNil(val) && boolAttrs.has(key)) validAt(key, val, isBool)
      maybeSetProp(node, key, prev, val)
      return
    }
  }

  setAttr(val, key, node)
}

// Diffing sometimes avoids style/layout recalculations.
function maybeSetProp(tar, key, prev, next) {
  if (!is(prev, next)) tar[key] = next
}

function setAttrs(node, attrs) {
  eachVal(attrs, setAttr, node)
}

// Should be kept in sync with `str.mjs` -> `attr`.
function setAttr(val, key, node) {
  valid(key, isStr)

  if (isNil(val)) {
    node.removeAttribute(key)
    return
  }

  if (boolAttrs.has(key)) {
    validAt(key, val, isBool)
    if (val) node.setAttribute(key, '')
    else node.removeAttribute(key)
    return
  }

  validAt(key, val, isStringable)
  node.setAttribute(key, toStrUnchecked(val))
}

function setClass(node, val) {
  const prev = node.className

  // `HTMLElement`.
  if (isStr(prev)) {
    maybeSetProp(node, 'className', prev, toStr(val))
    return
  }

  // `SVGElement` and possibly others.
  setAttr(val, 'class', node)
}

// Should be kept in sync with `str.mjs` -> `encodeStyle`.
function setStyle(node, val) {
  if (isNil(val) || isStr(val)) return setAttr(val, 'style', node)
  if (isDict(val)) return eachVal(val, setStyleProp, node.style)
  throw Error(`style must be string or dict, got ${show(val)}`)
}

function setStyleProp(val, key, style) {
  if (isNil(val)) val = ''
  validAt(key, val, isStr)
  maybeSetProp(style, key, style[key], val)
}

function setDataset(node, val) {
  eachVal(val, setDatasetProp, node.dataset)
}

function setDatasetProp(val, key, dataset) {
  if (isNil(val)) delete dataset[key]
  else {
    validAt(key, val, isStringable)
    dataset[key] = toStrUnchecked(val)
  }
}

function addClass(acc, val) {
  if (isArr(val)) return fold(val, acc, addClass)

  // For convenience, any falsy value is skipped, allowing `a && b`.
  if (!val) return acc

  val = str(val)
  if (!acc) return val
  return `${acc} ${val}`
}

function validAt(key, val, fun) {
  if (!fun(val)) {
    throw Error(`invalid property "${show(key)}": expected ${show(val)} to satisfy ${show(fun)}`)
  }
}

// See `impl.md` on void elems.
function elemValid(name, children) {
  valid(name, isStr)
  if (children.length && voidElems.has(name)) {
    throw Error(`got unexpected children for void element "${show(name)}"`)
  }
}

// Many DOM APIs consider only `null` to be nil.
function normNil(val) {return isNil(val) ? null : val}
function normStr(val) {return isNil(val) ? null : str(val)}
function toStr(val) {return toStrUnchecked(only(val, isStringable))}

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

function eachVal(val, fun, ...args) {
  if (isNil(val)) return
  valid(val, isDict)
  for (const key in val) fun(val[key], key, ...args)
}

function fold(val, acc, fun, ...args) {
  for (let i = 0; i < val.length; i += 1) acc = fun(acc, val[i], i, ...args)
  return acc
}

function mapMutDeep(i, val, _i, acc, fun, ...args) {
  if (isNil(val)) return i
  if (isArr(val)) return fold(val, i, mapMutDeep, acc, fun, ...args)
  acc.push(fun(val, i, ...args))
  return i + 1
}

function sumBy(val, fun, ...args) {return fold(val, 0, addBy, fun, ...args)}
function addBy(acc, val, i, fun, ...args) {return acc + fun(val, i, ...args)}

function is(a, b) {return Object.is(a, b)}
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

function str(val) {return isNil(val) ? '' : only(val, isStr)}
function only(val, test) {valid(val, test); return val}

function valid(val, test) {
  if (!test(val)) throw Error(`expected ${show(val)} to satisfy test ${show(test)}`)
}

function validInst(val, Cls) {
  if (!isInst(val, Cls)) {
    throw Error(`expected ${show(val)} to be an instance of ${show(Cls)}`)
  }
}

// Placeholder, might improve.
function show(val) {return (isFun(val) && val.name) || String(val)}
