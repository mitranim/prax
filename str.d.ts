import type {Props, Raw, LenFn, MapFn} from './dom.d.ts';

export {Raw, boolAttrs, voidElems, cls} from './dom.d.ts';

type Child = string | Child[];

export function E(name: string, props: Props, ...children: Child[]): Raw;

export function S(name: string, props: Props, ...children: Child[]): Raw;

export function F(...children: Child[]): Raw;

export function escapeText(val: string): string;

export function escapeAttr(val: string): string;

export function doc(val: Child): string;

export const len: LenFn<Child>;

export const map: MapFn<Child>; 

export function e(name: string): (props?: Props, ...children: Child[]) => Raw;
export function e(name: string, props: Props): (...children: Child[]) => Raw;
export function e(name: string, props: Props, ...children: Child[]): (...children: Child[]) => Raw;
