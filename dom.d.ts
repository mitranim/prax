type Nil = null | undefined;
type NonNilPrim = string | number | bigint | boolean;
type Prim = Nil | NonNilPrim;

interface Stringable {
    [Symbol.toStringTag](): string
}

type Props = Nil | Record<string, NonNilPrim | Stringable>;

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

// TODO
// export function map(val, fun, ...args): unknown

export function doc<T>(val?: T): T;

export const boolAttrs: Set<string>;

export const voidElems: Set<string>;

export class Raw extends String {}

export function e<N extends HTMLElement>(name: string): (props?: Props, ...children: Child[]) => N;
export function e<N extends HTMLElement>(name: string, props: Props): (...children: Child[]) => N;
export function e<N extends HTMLElement>(name: string, props: Props, ...children: Child[]): (...children: Child[]) => N;

