/// <reference types="./dom.d.ts" />
// See `impl.md` for implementation notes.

/* Public API */

export function E(name, props, ...children) {
  reqElem(name, children)
  const node = document.createElement(name, props)
  return initNode(node, props, children)
}

export function S(name, props, ...children) {
  req(name, isString)
  const node = document.createElementNS(`http://www.w3.org/2000/svg`, name, props)
  return initNode(node, props, children)
}

export function F(...vals) {return appendChildren(new DocumentFragment(), vals)}

export function reset(node, props, ...children) {
  resetProps(node, props)
  return resetChildren(node, children)
}

export function resetProps(node, props) {
  each(req(props, isProps), setProp, reqInst(node, Element))
  return node
}

export function replace(node, ...children) {
  reqInst(node, Node)
  node.parentNode.replaceChild(F(...children), node)
}

export function resetDoc(head, body) {
  resetHead(head)
  resetBody(body)
}

export function resetHead(head) {
  reqInst(head, HTMLHeadElement)
  removeMetas(head)
  addMetas(head)
}

export function resetBody(body) {
  reqInst(body, HTMLBodyElement)
  focusStash()
  document.body = body
  focusPop()
}

export function resetText(node, src) {
  reqInst(node, Element).textContent = toText(src)
  return node
}

export function reg(cls) {
  if (clsTags.has(cls)) return
  customElements.define(clsTag(cls), cls, clsExtends(cls))
}

export function props(node) {
  reqInst(node, Element)
  return fold(node.attributes, {dataset: node.dataset}, attrToProp, node)
}

export function cls(...vals) {return fold(vals, ``, clsAppend)}
export function len(val) {return isNil(val) ? 0 : (isSeq(val) ? sum(val, len) : 1)}
export function vac(val) {return hasSome(val) ? val : undefined}

export function map(val, fun) {
  req(fun, isFun)
  const acc = []
  mapMutDeep(0, val, acc, fun)
  return acc
}

// Shim for isomorphism with `str.mjs`.
export function doc(val) {return val}

export function merge(...vals) {
  const len = count(vals, isSome)

  return (
    !len
    ? undefined
    : len === 1
    ? req(vals.find(isSome), isStruct)
    : fold(vals, {}, addProps)
  )
}

export function lax(val) {return isLax = (isNil(val) ? isLax : req(val, isBool))}

// The specification postulates the concept, but where's the standard list?
// Taken from non-authoritative sources.
//
// https://www.w3.org/TR/html52/infrastructure.html#boolean-attribute
export const boolAttrs = /* @__PURE__ */ new Set([
  `allowfullscreen`, `allowpaymentrequest`, `async`,    `autofocus`,
  `autoplay`,        `checked`,             `controls`, `default`,
  `disabled`,        `formnovalidate`,      `hidden`,   `ismap`,
  `itemscope`,       `loop`,                `multiple`, `muted`,
  `nomodule`,        `novalidate`,          `open`,     `playsinline`,
  `readonly`,        `required`,            `reversed`, `selected`,
  `truespeed`,
])

// https://www.w3.org/TR/html52/
// https://www.w3.org/TR/html52/syntax.html#writing-html-documents-elements
export const voidElems = /* @__PURE__ */ new Set([
  `area`, `base`, `br`, `col`, `embed`, `hr`, `img`, `input`, `link`, `meta`,
  `param`, `source`, `track`, `wbr`,
])

export class Raw extends String {}

export function e(...args) {return E.bind(undefined, ...args)}

/* Internal Utils */

let isLax = false

function initNode(node, props, children) {
  resetProps(node, props)
  return appendChildren(node, children)
}

function resetChildren(node, children) {
  if (!children.length) {
    removeNodes(node)
    return node
  }

  // See `impl.md`.
  const frag = F(...children)
  removeNodes(node)
  node.append(frag)
  return node
}

function removeNodes(node) {
  reqInst(node, Node)
  while (node.firstChild) node.firstChild.remove()
}

function appendChildren(node, children) {
  for (const val of children) appendChild(node, val)
  return node
}

function appendChild(node, val) {
  if (isNil(val)) {return}
  if (isString(val)) {if (val) node.append(val); return}
  if (isInst(val, Node)) {node.append(val); return}
  if (isInst(val, Raw)) {appendRawChild(node, val); return}
  if (isSeq(val)) {appendChildren(node, val); return}
  if (isStringable(val)) {appendChild(node, String(val)); return}
  maybeNonStringable(val)
}

// Probably inefficient. Might find better solutions. Needs benchmarks.
function appendRawChild(node, val) {
  const clone = node.cloneNode()
  clone.innerHTML = val
  while (clone.firstChild) node.append(clone.firstChild)
}

// Should be kept in sync with `str.mjs` -> `encodeProp`.
// Expected to accumulate more special cases over time.
function setProp(val, key, node) {
  if (key === `children`)     {throw Error(`use {R} from 'prax/rcompat.mjs' for children-in-props`)}
  if (key === `is`)           {return}
  if (key === `attributes`)   {setAttrs(node, val); return}
  if (key === `class`)        {setClass(node, optStr(val)); return}
  if (key === `className`)    {setClass(node, optStr(val)); return}
  if (key === `style`)        {setStyle(node, val); return}
  if (key === `dataset`)      {setDataset(node, val); return}
  if (/^aria[A-Z]/.test(key)) {setAttr(val, toAria(key), node); return}
  setUnknownProp(node, key, val)
}

// Careful balancing act: minimizing gotchas AND special-case knowledge. Likely
// one of the bottlenecks. For a VERY approximate inverse, see `guessProp`.
function setUnknownProp(node, key, val) {
  if (key in node) {
    const prev = node[key]
    if (isNil(prev) || isFun(prev)) {
      maybeSetProp(node, key, prev, normNil(val))
      return
    }

    if (isString(prev)) {
      maybeSetProp(node, key, prev, toStr(val))
      return
    }

    if (isPrim(prev)) {
      if (!isPrim(val)) throw Error(`can't set non-primitive "${show(key)}": ${show(val)} on ${show(node)}`)
      if (!isNil(val) && boolAttrs.has(key)) reqAt(key, val, isBool)
      maybeSetProp(node, key, prev, val)
      return
    }
  }

  setAttr(val, key, node)
}

// Diffing sometimes avoids style/layout recalculations.
function maybeSetProp(tar, key, prev, next) {if (!is(prev, next)) tar[key] = next}

function setAttrs(node, attrs) {each(attrs, setAttr, node)}

// Should be kept in sync with `str.mjs` -> `attr`.
function setAttr(val, key, node) {
  req(key, isString)

  if (boolAttrs.has(key)) {
    if (!isNil(val)) reqAt(key, val, isBool)
    val = val ? `` : undefined
  }

  val = toMaybeStr(val)
  if (isNil(val)) node.removeAttribute(key)
  else node.setAttribute(key, val)
}

function setClass(node, val) {
  const prev = node.className

  // `HTMLElement`.
  if (isString(prev)) {
    maybeSetProp(node, `className`, prev, toStr(val))
    return
  }

  // `SVGElement` and possibly others.
  setAttr(val, `class`, node)
}

// Should be kept in sync with `str.mjs` -> `encodeStyle`.
function setStyle(node, val) {
  if (isNil(val) || isString(val)) return setAttr(val, `style`, node)
  if (isStruct(val)) return each(val, setStyleProp, node.style)
  throw TypeError(`style must be string or dict, got ${show(val)}`)
}

function setStyleProp(val, key, style) {
  if (isNil(val)) val = ``
  reqAt(key, val, isString)
  maybeSetProp(style, key, style[key], val)
}

function setDataset(node, val) {each(val, setDatasetProp, node.dataset)}

function setDatasetProp(val, key, dataset) {
  val = toMaybeStr(val)
  if (isNil(val)) delete dataset[key]
  else dataset[key] = val
}

// ARIA attributes appear to be case-insensitive, with only the `aria-` prefix
// containing a hyphen.
function toAria(key) {return `aria-${key.slice(4).toLowerCase()}`}

function clsAppend(acc, val) {
  if (isSeq(val)) return fold(val, acc, clsAppend)

  // For convenience, any falsy value is skipped, allowing `a && b`.
  if (!val) return acc

  val = str(val)
  if (!acc) return val
  return `${acc} ${val}`
}

function attrToProp(acc, {name, value}, node) {
  // Data attrs are redundant with `.dataset`.
  if (name.startsWith(`data-`)) return acc
  acc[name] = guessProp(node, name, value)
  return acc
}

// VERY approximate inverse of `setUnknownProp`.
function guessProp(node, key, val) {
  if (key in node) {
    const prev = node[key]
    if (isPrim(prev)) return prev
  }
  return val
}

function addProps(acc, props) {
  if (isNil(props)) return acc
  req(props, isStruct)

  for (const key in props) {
    const val = props[key]

    if (key === `attributes` || key === `dataset` || key === `style`) {
      acc[key] = maybePatch(acc[key], val)
      continue
    }

    if (key === `class` || key === `className`) {
      acc[key] = cls(acc[key], val)
      continue
    }

    acc[key] = val
  }

  return acc
}

function maybePatch(prev, next) {
  return isStruct(prev) && isStruct(next)
    ? {...prev, ...next}
    : isStruct(prev) && isNil(next)
    ? prev
    : next
}

export const metas = /* @__PURE__ */ new WeakSet()

function removeMetas(head) {
  copy(document.head.children).forEach(removeMeta, new Set(head.children))
}

function removeMeta(val) {if (metas.has(val) && !this.has(val)) val.remove()}
function addMetas(head) {copy(head.children).forEach(addMeta)}

function addMeta(val) {
  if (val instanceof HTMLTitleElement) {
    document.title = val.textContent
    return
  }
  metas.add(val)
  document.head.append(val)
}

// Index path of last focused DOM node, starting from the root.
export const focus = []

export function focusStash() {
  focus.length = 0
  let val = document.activeElement
  while (val && val.parentNode) {
    focus.push(indexOf(val.parentNode.childNodes, val))
    val = val.parentNode
  }
  focus.reverse()
}

export function focusApply() {
  let val = document
  for (const ind of focus) if (!(val = val.childNodes[ind])) return
  if (hasMeth(val, `focus`)) val.focus()
}

export function focusPop() {
  try {focusApply()}
  finally {focus.length = 0}
}

export const clsTags = /* @__PURE__ */ new WeakMap()

export function clsTag(cls) {
  return clsTags.get(cls) || mapSet(clsTags, cls, clsNameTag(clsName(cls)))
}

export function clsName(cls) {return req(cls, isFun).name}

export function clsNameTag(name) {
  req(name, isString)
  return name ? `a-` + camelToKebab(name).replace(/^-/, ``) : ``
}

export function clsExtends(cls) {
  const tag = clsTagBase(cls)
  return tag ? {extends: tag} : undefined
}

export function clsTagBase(cls) {
  req(cls, isFun)

  while (isFun(cls)) {
    const name = clsTagNative(cls)
    if (name) return name
    cls = Object.getPrototypeOf(cls)
  }

  return ``
}

export function clsTagNative(cls) {
  const name = clsName(cls)
  if (!window[name]) return ``
  if (name === `HTMLAnchorElement`) return `a`
  const match = name.match(/^HTML(\w+)Element$/)
  return match ? match[1].toLowerCase() : ``
}

export function reqAt(key, val, fun) {
  if (!fun(val)) {
    throw TypeError(`invalid property ${show(key)}: expected ${show(val)} to satisfy ${show(fun)}`)
  }
}

// See `impl.md` on void elems.
function reqElem(name, children) {
  req(name, isString)
  if (children.length && voidElems.has(name)) {
    throw Error(`got unexpected children for void element "${show(name)}"`)
  }
}

// Many DOM APIs consider only `null` to be nil, but not `undefined`.
function normNil(val) {return isNil(val) ? null : val}

export function toMaybeStr(val) {
  if (isNil(val)) return null
  if (isString(val)) return val
  if (isStringable(val)) return String(val)
  maybeNonStringable(val)
  return null
}

export function toStr(val) {return str(toMaybeStr(val))}

function maybeNonStringable(val) {
  if (!isLax) throw TypeError(`${show(val)} is not stringable`)
}

export function isStringable(val) {return isPrim(val) || isStringableObj(val)}

function isStringableObj(val) {
  if (!isObj(val) || !(`toString` in val)) return false
  const {toString} = val
  return (
    isFun(toString) &&
    toString !== Object.prototype.toString &&
    toString !== Array.prototype.toString
  )
}

export function toText(val) {return isSeq(val) ? fold(val, ``, addText) : toStr(val)}
function addText(acc, val) {return acc + toText(val)}

export function camelToKebab(val) {return words(val).join(`-`)}
export function words(val) {return val.split(/(?=[A-Z])/g).map(toLower)}
function toLower(val) {return val.toLowerCase()}

function each(val, fun, ...args) {
  if (isNil(val)) return
  req(val, isStruct)
  for (const key in val) fun(val[key], key, ...args)
}

// This looks dumb, but preserves decent performance for arrays.
export function fold(val, acc, fun, ...args) {
  if (isArr(val)) {
    for (const elem of val) acc = fun(acc, elem, ...args)
  }
  else if (val) {
    for (const elem of val) acc = fun(acc, elem, ...args)
  }
  return acc
}

function mapMutDeep(i, val, acc, fun) {
  if (isNil(val)) return i
  if (isSeq(val)) return fold(val, i, mapMutDeep, acc, fun)
  acc.push(fun(val, i))
  return i + 1
}

// Suboptimal, short, used in non-bottlenecks.
function copy(val) {return [...val]}

function sum(val, fun) {return fold(val, 0, add, fun)}
function add(acc, val, fun) {return acc + fun(val)}
function count(val, fun) {return fold(val, 0, inc, fun)}
function inc(acc, val, fun) {return fun(val) ? acc + 1 : acc}
function hasSome(val) {return !!val && (!isArr(val) || val.some(hasSome))}
function indexOf(list, val) {return Array.prototype.indexOf.call(list, val)}
function mapSet(map, key, val) {return map.set(key, val), val}

export function is(a, b) {return Object.is(a, b)}
export function isNil(val) {return val == null}
export function isSome(val) {return !isNil(val)}
export function isBool(val) {return typeof val === `boolean`}
export function isString(val) {return typeof val === `string`}
export function isComp(val) {return isObj(val) || isFun(val)}
export function isPrim(val) {return !isComp(val)}
export function isFun(val) {return typeof val === `function`}
export function isObj(val) {return val !== null && typeof val === `object`}
export function isArr(val) {return Array.isArray(val)}
export function isStruct(val) {return isObj(val) && !isIter(val) && !isIterAsync(val)}
export function isInst(val, cls) {return isObj(val) && val instanceof cls}
export function isSeq(val) {return isArr(val) || isIterator(val)}
export function isIter(val) {return hasMeth(val, Symbol.iterator)}
export function isIterAsync(val) {return hasMeth(val, Symbol.asyncIterator)}
export function isIterator(val) {return isIter(val) && hasMeth(val, `next`)}
export function isDict(val) {return isObj(val) && isDictProto(Object.getPrototypeOf(val))}
export function isProps(val) {return isNil(val) || (isStruct(val) && !isInst(val, Node))}
export function hasMeth(val, key) {return isComp(val) && key in val && isFun(val[key])}

function isDictProto(val) {return val === null || val === Object.prototype}

export function str(val) {return isNil(val) ? `` : req(val, isString)}
export function optStr(val) {return isNil(val) ? null : str(val)} // See `normNil`.

export function req(val, test) {
  if (!test(val)) {
    throw TypeError(`expected ${show(val)} to satisfy test ${show(test)}`)
  }
  return val
}

export function reqInst(val, cls) {
  if (!isInst(val, cls)) {
    throw TypeError(`expected ${show(val)} to be an instance of ${show(cls)}`)
  }
  return val
}

export function show(val) {
  if (isString(val) || isArr(val) || isDict(val) || (isComp(val) && !isFun(val.toString))) {
    try {return JSON.stringify(val)} catch {/* ignore */}
  }
  return (isFun(val) && val.name) || String(val)
}
