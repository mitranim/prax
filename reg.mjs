// deno-lint-ignore-file constructor-super

import * as d from './dom.mjs'

const G = globalThis

export class HTMLElement extends (G.HTMLElement || Object) {constructor() {reg(new.target), super()}}

const H = HTMLElement

export class HTMLAnchorElement extends (G.HTMLAnchorElement || H) {constructor() {reg(new.target), super()}}
export class HTMLAreaElement extends (G.HTMLAreaElement || H) {constructor() {reg(new.target), super()}}
export class HTMLAudioElement extends (G.HTMLAudioElement || H) {constructor() {reg(new.target), super()}}
export class HTMLBaseElement extends (G.HTMLBaseElement || H) {constructor() {reg(new.target), super()}}
export class HTMLBodyElement extends (G.HTMLBodyElement || H) {constructor() {reg(new.target), super()}}
export class HTMLBRElement extends (G.HTMLBRElement || H) {constructor() {reg(new.target), super()}}
export class HTMLButtonElement extends (G.HTMLButtonElement || H) {constructor() {reg(new.target), super()}}
export class HTMLCanvasElement extends (G.HTMLCanvasElement || H) {constructor() {reg(new.target), super()}}
export class HTMLDataElement extends (G.HTMLDataElement || H) {constructor() {reg(new.target), super()}}
export class HTMLDataListElement extends (G.HTMLDataListElement || H) {constructor() {reg(new.target), super()}}
export class HTMLDetailsElement extends (G.HTMLDetailsElement || H) {constructor() {reg(new.target), super()}}
export class HTMLDialogElement extends (G.HTMLDialogElement || H) {constructor() {reg(new.target), super()}}
export class HTMLDivElement extends (G.HTMLDivElement || H) {constructor() {reg(new.target), super()}}
export class HTMLDListElement extends (G.HTMLDListElement || H) {constructor() {reg(new.target), super()}}
export class HTMLEmbedElement extends (G.HTMLEmbedElement || H) {constructor() {reg(new.target), super()}}
export class HTMLFieldSetElement extends (G.HTMLFieldSetElement || H) {constructor() {reg(new.target), super()}}
export class HTMLFontElement extends (G.HTMLFontElement || H) {constructor() {reg(new.target), super()}}
export class HTMLFormElement extends (G.HTMLFormElement || H) {constructor() {reg(new.target), super()}}
export class HTMLFrameElement extends (G.HTMLFrameElement || H) {constructor() {reg(new.target), super()}}
export class HTMLFrameSetElement extends (G.HTMLFrameSetElement || H) {constructor() {reg(new.target), super()}}
export class HTMLHeadElement extends (G.HTMLHeadElement || H) {constructor() {reg(new.target), super()}}
export class HTMLHeadingElement extends (G.HTMLHeadingElement || H) {constructor() {reg(new.target), super()}}
export class HTMLHRElement extends (G.HTMLHRElement || H) {constructor() {reg(new.target), super()}}
export class HTMLHtmlElement extends (G.HTMLHtmlElement || H) {constructor() {reg(new.target), super()}}
export class HTMLIFrameElement extends (G.HTMLIFrameElement || H) {constructor() {reg(new.target), super()}}
export class HTMLImageElement extends (G.HTMLImageElement || H) {constructor() {reg(new.target), super()}}
export class HTMLInputElement extends (G.HTMLInputElement || H) {constructor() {reg(new.target), super()}}
export class HTMLLabelElement extends (G.HTMLLabelElement || H) {constructor() {reg(new.target), super()}}
export class HTMLLegendElement extends (G.HTMLLegendElement || H) {constructor() {reg(new.target), super()}}
export class HTMLLIElement extends (G.HTMLLIElement || H) {constructor() {reg(new.target), super()}}
export class HTMLLinkElement extends (G.HTMLLinkElement || H) {constructor() {reg(new.target), super()}}
export class HTMLMapElement extends (G.HTMLMapElement || H) {constructor() {reg(new.target), super()}}
export class HTMLMarqueeElement extends (G.HTMLMarqueeElement || H) {constructor() {reg(new.target), super()}}
export class HTMLMenuElement extends (G.HTMLMenuElement || H) {constructor() {reg(new.target), super()}}
export class HTMLMetaElement extends (G.HTMLMetaElement || H) {constructor() {reg(new.target), super()}}
export class HTMLMeterElement extends (G.HTMLMeterElement || H) {constructor() {reg(new.target), super()}}
export class HTMLModElement extends (G.HTMLModElement || H) {constructor() {reg(new.target), super()}}
export class HTMLObjectElement extends (G.HTMLObjectElement || H) {constructor() {reg(new.target), super()}}
export class HTMLOListElement extends (G.HTMLOListElement || H) {constructor() {reg(new.target), super()}}
export class HTMLOptGroupElement extends (G.HTMLOptGroupElement || H) {constructor() {reg(new.target), super()}}
export class HTMLOptionElement extends (G.HTMLOptionElement || H) {constructor() {reg(new.target), super()}}
export class HTMLOutputElement extends (G.HTMLOutputElement || H) {constructor() {reg(new.target), super()}}
export class HTMLParagraphElement extends (G.HTMLParagraphElement || H) {constructor() {reg(new.target), super()}}
export class HTMLParamElement extends (G.HTMLParamElement || H) {constructor() {reg(new.target), super()}}
export class HTMLPictureElement extends (G.HTMLPictureElement || H) {constructor() {reg(new.target), super()}}
export class HTMLPreElement extends (G.HTMLPreElement || H) {constructor() {reg(new.target), super()}}
export class HTMLProgressElement extends (G.HTMLProgressElement || H) {constructor() {reg(new.target), super()}}
export class HTMLQuoteElement extends (G.HTMLQuoteElement || H) {constructor() {reg(new.target), super()}}
export class HTMLScriptElement extends (G.HTMLScriptElement || H) {constructor() {reg(new.target), super()}}
export class HTMLSelectElement extends (G.HTMLSelectElement || H) {constructor() {reg(new.target), super()}}
export class HTMLSlotElement extends (G.HTMLSlotElement || H) {constructor() {reg(new.target), super()}}
export class HTMLSourceElement extends (G.HTMLSourceElement || H) {constructor() {reg(new.target), super()}}
export class HTMLSpanElement extends (G.HTMLSpanElement || H) {constructor() {reg(new.target), super()}}
export class HTMLStyleElement extends (G.HTMLStyleElement || H) {constructor() {reg(new.target), super()}}
export class HTMLTableCaptionElement extends (G.HTMLTableCaptionElement || H) {constructor() {reg(new.target), super()}}
export class HTMLTableCellElement extends (G.HTMLTableCellElement || H) {constructor() {reg(new.target), super()}}
export class HTMLTableColElement extends (G.HTMLTableColElement || H) {constructor() {reg(new.target), super()}}
export class HTMLTableElement extends (G.HTMLTableElement || H) {constructor() {reg(new.target), super()}}
export class HTMLTableRowElement extends (G.HTMLTableRowElement || H) {constructor() {reg(new.target), super()}}
export class HTMLTableSectionElement extends (G.HTMLTableSectionElement || H) {constructor() {reg(new.target), super()}}
export class HTMLTemplateElement extends (G.HTMLTemplateElement || H) {constructor() {reg(new.target), super()}}
export class HTMLTextAreaElement extends (G.HTMLTextAreaElement || H) {constructor() {reg(new.target), super()}}
export class HTMLTimeElement extends (G.HTMLTimeElement || H) {constructor() {reg(new.target), super()}}
export class HTMLTitleElement extends (G.HTMLTitleElement || H) {constructor() {reg(new.target), super()}}
export class HTMLTrackElement extends (G.HTMLTrackElement || H) {constructor() {reg(new.target), super()}}
export class HTMLUListElement extends (G.HTMLUListElement || H) {constructor() {reg(new.target), super()}}
export class HTMLVideoElement extends (G.HTMLVideoElement || H) {constructor() {reg(new.target), super()}}

export class CustomElementRegistry {
  constructor() {
    this.tagToCls = new Map()
    this.clsToTag = new Map()
  }

  /* Standard behaviors */

  define(tag, cls) {
    d.req(tag, d.isString)
    d.req(cls, d.isFun)

    if (this.hasTag(tag)) {
      throw Error(`redundant registration of ${d.show(tag)}`)
    }
    if (this.hasCls(cls)) {
      throw Error(`redundant registration of ${d.show(cls)}`)
    }

    this.tagToCls.set(tag, cls)
    this.clsToTag.set(cls, tag)
  }

  get(key) {return this.tagToCls.get(key)}
  upgrade() {}
  whenDefined() {}
  get [Symbol.toStringTag]() {return this.constructor.name}

  /* Non-standard behaviors */

  hasTag(val) {return this.tagToCls.has(val)}
  tagCls(val) {return this.tagToCls.get(val)}

  hasCls(val) {return this.clsToTag.has(val)}
  clsTag(val) {return this.clsToTag.get(val)}

  clear() {
    this.tagToCls.clear()
    this.clsToTag.clear()
    return this
  }
}

// Short for "custom element registry". Mostly for internal use.
export const cer = new CustomElementRegistry()

export const customElements = cerPatch(G.customElements) || cer

function cerPatch(ref) {
  if (!ref) return undefined

  const defineBase = ref.define

  ref.define = function define(tag, cls, opt) {
    defineBase.call(this, tag, cls, opt)
    cer.define(tag, cls, opt)
  }

  return ref
}

export function reg(cls) {
  if (!cer.hasCls(cls) && !isClsNameBase(cls.name)) {
    customElements.define(clsTagSalted(cls), cls, clsExt(cls))
  }
  return cls
}

function isClsNameBase(name) {return name.endsWith(`Element`)}

// Avoids breakage due to class name collisions.
function clsTagSalted(cls) {
  const base = clsTag(cls)
  let tag = base
  let ind = 0
  while (cer.hasTag(tag)) tag = base + `-` + ind++
  return tag
}

function clsTag(cls) {
  const words = toWords(cls.name)
  switch (words.length) {
    case 0: return ``
    case 1: return `a-` + words[0].toLowerCase()
    default: return toKebab(words)
  }
}

function clsExt(cls) {
  const tag = clsTagBase(cls)
  return tag ? {extends: tag} : undefined
}

function clsTagBase(cls) {
  const name = clsNameBase(cls)
  if (!name) return ``

  if (!baseTags.has(name)) {
    const mat = name.match(/^HTML(\w+)Element$/)
    baseTags.set(name, mat ? mat[1].toLowerCase() : ``)
  }

  return baseTags.get(name)
}

function clsNameBase(cls) {
  while (d.isFun(cls)) {
    const {name} = cls
    if (isClsNameBase(name)) return window[name] ? name : ``
    cls = Object.getPrototypeOf(cls)
  }
  return ``
}

export const baseTags = /* @__PURE__ */ new Map()
  // Unambiguous cases.
  .set(`HTMLAnchorElement`, `a`)
  .set(`HTMLQuoteElement`, `blockquote`)
  .set(`HTMLDListElement`, `dl`)
  .set(`HTMLImageElement`, `img`)
  .set(`HTMLOListElement`, `ol`)
  .set(`HTMLParagraphElement`, `p`)
  .set(`HTMLTableCaptionElement`, `caption`)
  .set(`HTMLTableRowElement`, `tr`)
  .set(`HTMLUListElement`, `ul`)
  // Ambiguous cases.
  .set(`HTMLTableColElement`, `col`)       // All: col, colgroup.
  .set(`HTMLTableSectionElement`, `tbody`) // All: thead, tbody, tfoot.
  .set(`HTMLTableCellElement`, `td`)       // All: th, td.

function toWords(str) {
  return (str && str.match(/[A-Za-z0-9]+?(?=[^a-z0-9]|$)/g)) || []
}

function toKebab(words) {
  return words.join(`-`).toLowerCase()
}
