import * as f from 'fpx'

export function R(E, type, props, ...children) {
  f.valid(E, f.isFun)
  props = f.dict(props)

  try {
    if (f.isFun(type)) {
      propsToReact(props, children)
      const pro = type.prototype
      if (pro && f.isFun(pro.render)) return new type(props).render()
      return type(props)
    }

    children = propsFromReact(props, children)
    return E(type, props, ...children)
  }
  finally {
    Object.freeze(props)
  }
}

export function F({children}) {return children}

export function countChildren(val) {
  if (f.isNil(val)) return 0
  if (f.isList(val)) return f.sumBy(val, countChildren)
  return 1
}

export function mapChildren(val, fun, ...args) {
  f.valid(fun, f.isFun)
  const acc = []
  mapIter(0, val, 0, acc, fun, ...args)
  return acc
}

function propsToReact(props, children) {
  props.children = comb(trim(props.children), trim(children))
}

function propsFromReact(props, children) {
  if (!props || !('children' in props)) return children
  children = comb(props.children, children)
  delete props.children
  return children
}

// Imitates React's quirky "optimization" of children:
//
//   []     -> null
//   [a]    -> a
//   [a, b] -> [a, b]
function trim(children) {
  if (f.isList(children)) {
    if (!children.length) return null
    if (children.length === 1) return trim(children[0])
  }
  return children
}

function comb(a, b) {
  return f.isNil(a) ? b : f.isNil(b) ? a : [a, b]
}

function mapIter(i, val, _i, acc, fun, ...args) {
  if (f.isNil(val)) return i
  if (f.isList(val)) return f.fold(val, i, mapIter, acc, fun, ...args)
  acc.push(fun(val, i, ...args))
  return i + 1
}
