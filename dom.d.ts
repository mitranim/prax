export type Nil = null | undefined
export type Prim = Nil | string | number | bigint | boolean

export interface Stringable {toString(): string}

export type StringableRecord = Record<string, Nil | Stringable>

export interface KnownProps {
  style?: Nil | Stringable | StringableRecord
  dataset?: StringableRecord
  attributes?: StringableRecord
}

export type Props = KnownProps & StringableRecord

export type Child = Nil | Node | Stringable | Child[]

export function E<K extends keyof HTMLElementTagNameMap>(name: K, props?: Props, ...children: Child[]): HTMLElementTagNameMap[K]
export function E<N extends HTMLElement>(name: string, props?: Props, ...children: Child[]): N

export function S<K extends keyof SVGElementTagNameMap>(name: K, props?: Props, ...children: Child[]): SVGElementTagNameMap[K]

export function F(...children: Child[]): DocumentFragment

export function reset<N extends Node>(node: N, props?: Props, ...children: Child[]): N

export function resetProps<N extends Node>(node: N, props?: Props): N

export function replace<N extends Node>(node: N, ...children: Child[]): void

export type ClsVal = Nil | false | 0 | string | ClsVal[]

export function cls(...vals: ClsVal[]): string

interface LenFun<C> {len(val: C): number}

export const len: LenFun<Child>

type MapReturn<FunRes, Child> = Child extends Array<infer C> ? MapReturn<FunRes, C>[] : FunRes[]

interface MapFun<C> {
  <
    Val extends C,
    Fun extends <Res>(val: C extends Array<unknown> ? never : C, i: number, ...args: [A1, A2, A3, A4, A5, A6, A7, A8, A9]) => Res,
    A1, A2, A3, A4, A5, A6, A7, A8, A9
  >(
    val: Val,
    fun: Fun,
    ...args: [A1?, A2?, A3?, A4?, A5?, A6?, A7?, A8?, A9?]
  ): MapReturn<ReturnType<Fun>, Val>
}

export const map: MapFun<Child>

export function doc(val?: Child): Child

export const boolAttrs: Set<string>

export const voidElems: Set<string>

export class Raw extends String {}

export function e<K extends keyof HTMLElementTagNameMap>(name: K): (props?: Props, ...children: Child[]) => HTMLElementTagNameMap[K]
export function e<K extends keyof HTMLElementTagNameMap>(name: K, props: Props): (...children: Child[]) => HTMLElementTagNameMap[K]
export function e<K extends keyof HTMLElementTagNameMap>(name: K, props: Props, ...children: Child[]): (...children: Child[]) => HTMLElementTagNameMap[K]
export function e<N extends HTMLElement>(name: string): (props?: Props, ...children: Child[]) => N
export function e<N extends HTMLElement>(name: string, props: Props): (...children: Child[]) => N
export function e<N extends HTMLElement>(name: string, props: Props, ...children: Child[]): (...children: Child[]) => N
