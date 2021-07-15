import type {Props, Raw} from './dom.d.ts';

export {Raw, boolAttrs, voidElems, cls, len, map} from './dom.d.ts';

type Child = string | Child[];

export function E(name: string, props: Props, ...children: Child[]): Raw;

export function S(name: string, props: Props, ...children: Child[]): Raw;

export function F(...children: Child[]): Raw;

export function escapeText(val: string): string;

export function escapeAttr(val: string): string;

export function doc(val: Child): string;

export function e(name: string): (props?: Props, ...children: Child[]) => string;
export function e(name: string, props: Props): (...children: Child[]) => string;
export function e(name: string, props: Props, ...children: Child[]): (...children: Child[]) => string;
