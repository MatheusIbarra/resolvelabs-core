/** Gerador de senhas 100% no navegador, com `crypto.getRandomValues` (nada é enviado a servidor). */

export interface PasswordOptions {
  length: number;
  upper: boolean;
  lower: boolean;
  digits: boolean;
  symbols: boolean;
  /** Evita caracteres parecidos (O/0, I/l/1, |). */
  avoidAmbiguous: boolean;
}

export const MIN_LENGTH = 8;
export const MAX_LENGTH = 64;

const SETS = {
  lower: "abcdefghijklmnopqrstuvwxyz",
  upper: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  digits: "0123456789",
  symbols: "!@#$%^&*()-_=+[]{};:,.?",
} as const;
const AMBIGUOUS = /[O0Il1|]/g;

export class NoSecureRandomError extends Error {
  constructor() {
    super("crypto.getRandomValues indisponível");
    this.name = "NoSecureRandomError";
  }
}

/** Inteiro uniforme em [0, max) por amostragem com rejeição (o operador % puro favoreceria os primeiros valores). */
function randomInt(max: number): number {
  const c = globalThis.crypto;
  if (!c?.getRandomValues) throw new NoSecureRandomError();
  const limit = Math.floor(0x1_0000_0000 / max) * max;
  const buf = new Uint32Array(1);
  do c.getRandomValues(buf);
  while (buf[0] >= limit);
  return buf[0] % max;
}

export function activeSets(o: PasswordOptions): string[] {
  const keys = (["lower", "upper", "digits", "symbols"] as const).filter((k) => o[k]);
  return keys.map((k) => (o.avoidAmbiguous ? SETS[k].replace(AMBIGUOUS, "") : SETS[k])).filter(Boolean);
}

/** Tamanho do alfabeto em uso (base da estimativa de entropia). */
export function poolSize(o: PasswordOptions): number {
  return new Set(activeSets(o).join("")).size;
}

export function generatePassword(o: PasswordOptions): string {
  const sets = activeSets(o);
  const length = Math.min(MAX_LENGTH, Math.max(MIN_LENGTH, Math.floor(o.length)));
  if (sets.length === 0) return "";
  const pool = sets.join("");
  // Garante ao menos um caractere de cada tipo escolhido e completa com o alfabeto inteiro.
  const chars = sets.map((s) => s[randomInt(s.length)]);
  while (chars.length < length) chars.push(pool[randomInt(pool.length)]);
  for (let i = chars.length - 1; i > 0; i--) {
    const j = randomInt(i + 1); // Fisher-Yates
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join("");
}

export type Strength = { label: "Fraca" | "Razoável" | "Forte" | "Muito forte"; bits: number; level: 1 | 2 | 3 | 4 };

/** Estimativa: comprimento x log2(alfabeto). Não considera padrões; é um teto para senhas realmente aleatórias. */
export function estimateStrength(o: PasswordOptions): Strength {
  const bits = Math.round(o.length * Math.log2(Math.max(2, poolSize(o))));
  if (bits < 40) return { label: "Fraca", bits, level: 1 };
  if (bits < 60) return { label: "Razoável", bits, level: 2 };
  if (bits < 80) return { label: "Forte", bits, level: 3 };
  return { label: "Muito forte", bits, level: 4 };
}
