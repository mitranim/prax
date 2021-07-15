type Nil = null | undefined;
type Primitive = string | number | bigint | boolean;

type Prop = Nil | Primitive;
type Props = Nil | Record<string, Prop>;

type Child = Nil | Primitive | Node | Child[];

export function E<N extends HTMLInputElement>(name: 'input', props?: Props, ...children: Child[]): N;
export function E<N extends HTMLElement>(name: string, props?: Props, ...children: Child[]): N;

export function S(name: string, props?: Props, ...children: Child[]): SVGElement;

export function F(...children: Child[]): Node;

export function reset<N extends Node>(node: N | Nil, props?: Props, ...children: Child[]): N | Nil;

export function resetProps<N extends Node>(node: N | Nil, props?: Props): N | Nil;

export function replace<N extends Node>(node: N | Nil, ...children: Child[]): void;

type ClsVal = Nil | Primitive | Array<ClsVal>;

export function cls(...vals: ClsVal[]): string;

type LenVal = Nil | Primitive | Element | Array<LenVal>;

export function len(val: LenVal): number;

// TODO
// export function map(val, fun, ...args): unknown

export function doc<T>(val?: T): T;

export const boolAttrs: Set<string>;

export const voidElems: Set<string>;

export class Raw extends String {}

export const e:
    | ((name: string) => (props?: Props, ...children: Child[]) => Node)
    | ((name: string, props: Props) => (...children: Child[]) => Node)
    | ((name: string, props: Props, ...children: Child[]) => (...children: Child[]) => Node)
