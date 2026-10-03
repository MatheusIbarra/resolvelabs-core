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
