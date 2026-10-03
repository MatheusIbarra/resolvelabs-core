const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// bcrypt só considera os primeiros 72 bytes da senha.
export const PASSWORD_MIN = 8;
export const PASSWORD_MAX_BYTES = 72;

export function parseEmail(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const email = value.trim().toLowerCase();
  return email.length <= 254 && EMAIL_RE.test(email) ? email : null;
}

export function passwordError(value: unknown): { key: "passwordInvalid" | "passwordShort" | "passwordLong"; vars?: { min: number } } | null {
  if (typeof value !== "string") return { key: "passwordInvalid" };
  if (value.length < PASSWORD_MIN) return { key: "passwordShort", vars: { min: PASSWORD_MIN } };
  if (new TextEncoder().encode(value).length > PASSWORD_MAX_BYTES) return { key: "passwordLong" };
  return null;
}

export function isDuplicateKeyError(err: unknown): boolean {
  return typeof err === "object" && err !== null && (err as { code?: number }).code === 11000;
}

/** Celular brasileiro: DDD (11-99) + 9 + 8 dígitos. Aceita máscara; devolve só os 11 dígitos. */
const PHONE_RE = /^[1-9][1-9]9\d{8}$/;

export function parsePhone(value: unknown): string | null {
  if (typeof value !== "string" || value.length > 30) return null;
  let digits = value.replace(/\D/g, "");
  if (digits.length === 13 && digits.startsWith("55")) digits = digits.slice(2);
  return PHONE_RE.test(digits) ? digits : null;
}
