// deno-lint-ignore-file no-empty-interface

export type Nil = null | undefined
export type Prim = Nil | string | number | bigint | boolean | symbol

/*
Technically, Prax also supports automatic stringification of objects whose
`.toString()` is not inherited from `Object` or `Array`. Unclear how to express
this at the type level. May revise.
*/
// deno-lint-ignore ban-types
export type Stringable = Prim | String

export type StringableRecord = Record<string, Nil | Stringable>

export interface KnownProps {
  style?: Nil | Stringable | StringableRecord
  dataset?: StringableRecord
  attributes?: StringableRecord
}

export type Props = KnownProps | StringableRecord

export type Child = Nil | Node | Stringable | Child[]

export function E<K extends keyof HTMLElementTagNameMap>(name: K, props?: Props, ...children: Child[]): HTMLElementTagNameMap[K]
export function E<N extends HTMLElement>(name: string, props?: Props, ...children: Child[]): N

export function S<K extends keyof SVGElementTagNameMap>(name: K, props?: Props, ...children: Child[]): SVGElementTagNameMap[K]

export function F(...children: Child[]): DocumentFragment

export function reset<N extends Node>(node: N, props?: Props, ...children: Child[]): N

export function resetProps<N extends Node>(node: N, props?: Props): N

export function replace(node: Node, ...children: Child[]): void

export function resetDoc(head: HTMLHeadElement, body: HTMLBodyElement): void

export function resetHead(head: HTMLHeadElement): void

export function resetText(node: HTMLElement, src: Stringable): HTMLElement

export function reg(cls: {new(): HTMLElement}): void

export function props(node: Node): Props

export type ClsVal = Nil | false | 0 | string | ClsVal[]

export function cls(...vals: ClsVal[]): string

export function len(val: Child): number

export function vac(val: Child): Child

export function map<T>(val: Child, fun: (child: Child, i?: number) => T): T

export function doc(val: Child): Child

export function merge(...props: Props[]): Props

export function lax(val?: boolean): boolean

export const boolAttrs: Set<string>

export const voidElems: Set<string>

export class Raw extends String {}

export function e<K extends keyof HTMLElementTagNameMap>(name: K): (props?: Props, ...children: Child[]) => HTMLElementTagNameMap[K]
export function e<K extends keyof HTMLElementTagNameMap>(name: K, props: Props): (...children: Child[]) => HTMLElementTagNameMap[K]
export function e<K extends keyof HTMLElementTagNameMap>(name: K, props: Props, ...children: Child[]): (...children: Child[]) => HTMLElementTagNameMap[K]
export function e<N extends HTMLElement>(name: string): (props?: Props, ...children: Child[]) => N
export function e<N extends HTMLElement>(name: string, props: Props): (...children: Child[]) => N
export function e<N extends HTMLElement>(name: string, props: Props, ...children: Child[]): (...children: Child[]) => N

declare global {
  interface Node {}
  interface Element extends Node {}
  interface HTMLElement extends Element {}
  interface HTMLHeadElement extends Element {}
  interface HTMLBodyElement extends Element {}
  interface DocumentFragment extends Node {}
  interface HTMLElementTagNameMap {}
  interface SVGElementTagNameMap {}
}
