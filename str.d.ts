import type {Nil, Stringable, Props, Raw, LenFun, MapFun} from './dom.d.ts'

export type {Nil, Prim, Stringable, StringableRecord, Props, ClsVal} from './dom.d.ts'

export {Raw, boolAttrs, voidElems, cls} from './dom.d.ts'

export type Child = Nil | Stringable | Child[]

export function E(name: string, props: Props, ...children: Child[]): Raw

export function S(name: string, props: Props, ...children: Child[]): Raw

export function F(...children: Child[]): Raw

export function escapeText(val: string): string

export function escapeAttr(val: string): string

export function doc(val?: Child): string

export const len: LenFun<Child>

export const map: MapFun<Child>

export function e(name: string): (props?: Props, ...children: Child[]) => Raw
export function e(name: string, props: Props): (...children: Child[]) => Raw
export function e(name: string, props: Props, ...children: Child[]): (...children: Child[]) => Raw
