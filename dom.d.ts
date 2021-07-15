type Nil = null | undefined;
type Primitive = string | number | bigint | boolean;

type Prop = Nil | Primitive;
type Props = Nil | Record<string, Prop>;

type Child = Nil | Primitive | Node | Child[];

export function E<K extends keyof HTMLElementTagNameMap>(name: K, props?: Props, ...children: Child[]): HTMLElementTagNameMap[K];
export function E<N extends HTMLElement>(name: string, props?: Props, ...children: Child[]): N;

export function S<K extends keyof SVGElementTagNameMap>(name: K, props?: Props, ...children: Child[]): SVGElementTagNameMap[K];

export function F(...children: Child[]): Node;

export function reset<N extends Node>(node: N | Nil, props?: Props, ...children: Child[]): N | Nil;

export function resetProps<N extends Node>(node: N | Nil, props?: Props): N | Nil;

export function replace<N extends Node>(node: N | Nil, ...children: Child[]): void;

type ClsVal = Nil | Primitive | Array<ClsVal>;

export function cls(...vals: ClsVal[]): string;

type LenVal = Nil | Primitive | Node | Array<LenVal>;

export function len(val: LenVal): number;

// TODO
// export function map(val, fun, ...args): unknown

export function doc<T>(val?: T): T;

export const boolAttrs: Set<string>;

export const voidElems: Set<string>;

export class Raw extends String {}

export function e<N extends HTMLElement>(name: string): (props?: Props, ...children: Child[]) => N;
export function e<N extends HTMLElement>(name: string, props: Props): (...children: Child[]) => N;
export function e<N extends HTMLElement>(name: string, props: Props, ...children: Child[]): (...children: Child[]) => N;

