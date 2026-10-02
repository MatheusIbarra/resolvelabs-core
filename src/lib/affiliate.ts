export const REF_COOKIE = "resolvelabs_ref";
export const REF_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 dias

// Alfabeto sem caracteres ambíguos (0/O, 1/I/L).
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

export function generateAffiliateCode(length = 6): string {
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join("");
}

/** Normaliza um código recebido do cliente (ex.: `?ref=dev10`). */
export function parseAffiliateCode(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const code = value.trim().toUpperCase();
  return /^[A-Z0-9_-]{3,32}$/.test(code) ? code : null;
}
