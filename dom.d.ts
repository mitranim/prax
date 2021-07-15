type Nil = null | undefined;
type Prim = Nil | string | number | bigint | boolean;

interface Stringable {
    toString(): string
}

type Props = Nil | Record<string, Stringable | Nil>;

type Child = Prim | Node | Child[];

export function E<K extends keyof HTMLElementTagNameMap>(name: K, props?: Props, ...children: Child[]): HTMLElementTagNameMap[K];
export function E<N extends HTMLElement>(name: string, props?: Props, ...children: Child[]): N;

export function S<K extends keyof SVGElementTagNameMap>(name: K, props?: Props, ...children: Child[]): SVGElementTagNameMap[K];

export function F(...children: Child[]): DocumentFragment;

export function reset<N extends Node>(node: N, props?: Props, ...children: Child[]): N;

export function resetProps<N extends Node>(node: N, props?: Props): N;

export function replace<N extends Node>(node: N, ...children: Child[]): void;

type ClsVal = Nil | false | 0 | string | ClsVal[];

export function cls(...vals: ClsVal[]): string;

export function len(val: Child): number;

type MapReturn<FnRes, Child> = Child extends Array<infer C> ? MapReturn<FnRes, C>[] : FnRes[];

export function map<
    Val extends Child,
    Fn extends <Res>(val: Prim | Node, i: number, ...args: [A1?, A2?, A3?, A4?, A5?, A6?, A7?, A8?, A9?]) => Res,
    A1, A2, A3, A4, A5, A6, A7, A8, A9
>(
    val: Val,
    fun: Fn,
    ...args: [A1?, A2?, A3?, A4?, A5?, A6?, A7?, A8?, A9?]
): MapReturn<ReturnType<Fn>, Val>

export function doc<T>(val?: T): T;

export const boolAttrs: Set<string>;

export const voidElems: Set<string>;

export class Raw extends String {}

export function e<N extends HTMLElement>(name: string): (props?: Props, ...children: Child[]) => N;
export function e<N extends HTMLElement>(name: string, props: Props): (...children: Child[]) => N;
export function e<N extends HTMLElement>(name: string, props: Props, ...children: Child[]): (...children: Child[]) => N;

