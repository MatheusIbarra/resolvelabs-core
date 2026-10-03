// Tipos dos dicionários. Cada arquivo em `messages/` define `en` e depois tipa `es` e `pt` com o mesmo formato:
// faltou uma chave em qualquer idioma, o `npm run typecheck` falha.

/** Mesma estrutura de T, com todo texto como `string` genérica (para tipar es/pt a partir do en). */
export type Shape<T> = T extends string ? string : T extends readonly (infer U)[] ? Shape<U>[] : { [K in keyof T]: Shape<T[K]> };

/** Texto com plural: usado por `tn(chave, quantidade)`. */
export interface Plural {
  one: string;
  other: string;
}

type Leaf = string | readonly unknown[] | Plural;

/** Todos os caminhos "a.b.c" que terminam em uma folha (texto, lista ou plural). */
export type Path<T> = {
  [K in keyof T & string]: T[K] extends Leaf ? K : `${K}.${Path<T[K]>}`;
}[keyof T & string];

export type PathValue<T, P extends string> = P extends `${infer H}.${infer R}`
  ? H extends keyof T
    ? PathValue<T[H], R>
    : never
  : P extends keyof T
    ? T[P]
    : never;

/** Caminhos cujo valor é um texto simples. */
export type StringPath<T> = {
  [K in Path<T>]: PathValue<T, K> extends string ? K : never;
}[Path<T>];

/** Caminhos cujo valor é `{ one, other }`. */
export type PluralPath<T> = {
  [K in Path<T>]: PathValue<T, K> extends Plural ? K : never;
}[Path<T>];

/** Todo caminho válido, inclusive nós intermediários (para `raw`). */
export type NodePath<T> = {
  [K in keyof T & string]: T[K] extends string | readonly unknown[] ? K : K | `${K}.${NodePath<T[K]>}`;
}[keyof T & string];
