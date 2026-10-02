/**
 * Geradores de dados de teste brasileiros (funções puras, sem rede).
 * Todos aceitam um `rng` opcional (0 <= n < 1) para resultados reproduzíveis em testes.
 */

export type Rng = () => number;

/** Aleatoriedade criptográfica (padrão). */
export const secureRng: Rng = () => {
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  return buf[0] / 0x1_0000_0000;
};

/** PRNG determinístico (mulberry32) para testes. */
export function seededRng(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const int = (rng: Rng, max: number) => Math.floor(rng() * max);
const digits = (rng: Rng, n: number) => Array.from({ length: n }, () => int(rng, 10));
const pick = <T,>(rng: Rng, arr: readonly T[]) => arr[int(rng, arr.length)];

// --- CPF -------------------------------------------------------------------

function cpfCheckDigit(base: number[]): number {
  const factor = base.length + 1;
  const sum = base.reduce((acc, d, i) => acc + d * (factor - i), 0);
  const rest = (sum * 10) % 11;
  return rest === 10 ? 0 : rest;
}

export function generateCpf(rng: Rng = secureRng, formatted = true): string {
  let base = digits(rng, 9);
  while (base.every((d) => d === base[0])) base = digits(rng, 9); // 111.111.111-11 etc. são inválidos
  const d1 = cpfCheckDigit(base);
  const d2 = cpfCheckDigit([...base, d1]);
  const s = [...base, d1, d2].join("");
  return formatted ? `${s.slice(0, 3)}.${s.slice(3, 6)}.${s.slice(6, 9)}-${s.slice(9)}` : s;
}

export function isValidCpf(value: string): boolean {
  const s = value.replace(/\D/g, "");
  if (s.length !== 11 || /^(\d)\1{10}$/.test(s)) return false;
  const d = s.split("").map(Number);
  return cpfCheckDigit(d.slice(0, 9)) === d[9] && cpfCheckDigit(d.slice(0, 10)) === d[10];
}

// --- CNPJ ------------------------------------------------------------------

const CNPJ_W1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
const CNPJ_W2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

function cnpjCheckDigit(base: number[], weights: number[]): number {
  const rest = base.reduce((acc, d, i) => acc + d * weights[i], 0) % 11;
  return rest < 2 ? 0 : 11 - rest;
}

export function generateCnpj(rng: Rng = secureRng, formatted = true): string {
  let root = digits(rng, 8);
  while (root.every((d) => d === root[0])) root = digits(rng, 8);
  const base = [...root, 0, 0, 0, 1]; // matriz (0001)
  const d1 = cnpjCheckDigit(base, CNPJ_W1);
  const d2 = cnpjCheckDigit([...base, d1], CNPJ_W2);
  const s = [...base, d1, d2].join("");
  return formatted ? `${s.slice(0, 2)}.${s.slice(2, 5)}.${s.slice(5, 8)}/${s.slice(8, 12)}-${s.slice(12)}` : s;
}

export function isValidCnpj(value: string): boolean {
  const s = value.replace(/\D/g, "");
  if (s.length !== 14 || /^(\d)\1{13}$/.test(s)) return false;
  const d = s.split("").map(Number);
  return cnpjCheckDigit(d.slice(0, 12), CNPJ_W1) === d[12] && cnpjCheckDigit(d.slice(0, 13), CNPJ_W2) === d[13];
}

// --- CEP -------------------------------------------------------------------

/** Faixas oficiais de CEP (5 primeiros dígitos) por UF, conforme a divisão dos Correios. */
export const CEP_RANGES: Record<string, [number, number][]> = {
  SP: [[1000, 19999]], RJ: [[20000, 28999]], ES: [[29000, 29999]], MG: [[30000, 39999]],
  BA: [[40000, 48999]], SE: [[49000, 49999]], PE: [[50000, 56999]], AL: [[57000, 57999]],
  PB: [[58000, 58999]], RN: [[59000, 59999]], CE: [[60000, 63999]], PI: [[64000, 64999]],
  MA: [[65000, 65999]], PA: [[66000, 68899]], AP: [[68900, 68999]], AM: [[69000, 69299], [69400, 69899]],
  RR: [[69300, 69399]], AC: [[69900, 69999]], DF: [[70000, 72799], [73000, 73699]],
  GO: [[72800, 72999], [73700, 76799]], RO: [[76800, 76999]], TO: [[77000, 77995]],
  MT: [[78000, 78899]], MS: [[79000, 79999]], PR: [[80000, 87999]], SC: [[88000, 89999]], RS: [[90000, 99999]],
};

export const UFS = Object.keys(CEP_RANGES);

/**
 * CEP formatado (00000-000) dentro de uma faixa real da UF. A faixa é verdadeira, mas isso não garante
 * que o logradouro exista: sem consultar uma base dos Correios, nenhum gerador offline consegue isso.
 */
export function generateCep(rng: Rng = secureRng, uf?: string, formatted = true): string {
  const ranges = CEP_RANGES[uf ?? pick(rng, UFS)] ?? CEP_RANGES.SP;
  const [lo, hi] = pick(rng, ranges);
  const prefix = String(lo + int(rng, hi - lo + 1)).padStart(5, "0");
  const suffix = String(int(rng, 1000)).padStart(3, "0");
  return formatted ? `${prefix}-${suffix}` : prefix + suffix;
}

// --- PIX -------------------------------------------------------------------

export type PixKind = "random" | "cpf-masked" | "email-masked";

export function generateUuid(rng: Rng = secureRng): string {
  const hex = Array.from({ length: 32 }, () => int(rng, 16).toString(16)).join("");
  const variant = (8 + int(rng, 4)).toString(16);
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4${hex.slice(13, 16)}-${variant}${hex.slice(17, 20)}-${hex.slice(20, 32)}`;
}

export function maskCpf(cpf: string): string {
  const s = cpf.replace(/\D/g, "");
  return `***.${s.slice(3, 6)}.${s.slice(6, 9)}-**`;
}

export function maskEmail(email: string): string {
  const [user, domain] = email.split("@");
  return `${user[0]}***@${domain}`;
}

/** Chave PIX aleatória (UUID v4) ou CPF/e-mail mascarados (como aparecem em comprovantes). */
export function generatePixKey(kind: PixKind = "random", rng: Rng = secureRng): string {
  if (kind === "cpf-masked") return maskCpf(generateCpf(rng));
  if (kind === "email-masked") return maskEmail(generateEmail(rng));
  return generateUuid(rng);
}

// --- Pessoa ----------------------------------------------------------------

const FIRST = ["Ana", "Bruno", "Camila", "Daniel", "Eduarda", "Felipe", "Gabriela", "Henrique", "Isabela", "João", "Larissa", "Marcos", "Natália", "Pedro", "Rafaela", "Thiago", "Beatriz", "Lucas", "Mariana", "Rodrigo"];
const LAST = ["Silva", "Santos", "Oliveira", "Souza", "Pereira", "Costa", "Rodrigues", "Almeida", "Nascimento", "Lima", "Araújo", "Ribeiro", "Carvalho", "Gomes", "Martins", "Barbosa", "Ferreira", "Rocha"];

export const generateName = (rng: Rng = secureRng) => `${pick(rng, FIRST)} ${pick(rng, LAST)} ${pick(rng, LAST)}`;

const slug = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

export const generateEmail = (rng: Rng = secureRng) =>
  `${slug(pick(rng, FIRST))}.${slug(pick(rng, LAST))}${int(rng, 100)}@exemplo.com.br`;

const DDDS = [11, 12, 13, 14, 15, 16, 17, 18, 19, 21, 22, 24, 27, 28, 31, 32, 33, 34, 35, 37, 38, 41, 42, 43, 44, 45, 46, 47, 48, 49, 51, 53, 54, 55, 61, 62, 63, 64, 65, 66, 67, 68, 69, 71, 73, 74, 75, 77, 79, 81, 82, 83, 84, 85, 86, 87, 88, 89, 91, 92, 93, 94, 95, 96, 97, 98, 99];

export const generatePhone = (rng: Rng = secureRng) =>
  `(${pick(rng, DDDS)}) 9${digits(rng, 4).join("")}-${digits(rng, 4).join("")}`;

// --- Esquema -> JSON ---------------------------------------------------------

export const DATA_TYPES = [
  { id: "cpf", label: "CPF Válido" },
  { id: "cnpj", label: "CNPJ Válido" },
  { id: "cep", label: "CEP (faixa real da UF)" },
  { id: "nome", label: "Nome Brasileiro" },
  { id: "email", label: "E-mail" },
  { id: "telefone", label: "Telefone Celular" },
  { id: "pix", label: "Chave PIX Aleatória (UUID)" },
  { id: "pix_cpf", label: "Chave PIX (CPF mascarado)" },
  { id: "pix_email", label: "Chave PIX (e-mail mascarado)" },
] as const;

export type DataTypeId = (typeof DATA_TYPES)[number]["id"];

const GENERATORS: Record<DataTypeId, (rng: Rng) => string> = {
  cpf: (r) => generateCpf(r),
  cnpj: (r) => generateCnpj(r),
  cep: (r) => generateCep(r),
  nome: generateName,
  email: generateEmail,
  telefone: generatePhone,
  pix: (r) => generatePixKey("random", r),
  pix_cpf: (r) => generatePixKey("cpf-masked", r),
  pix_email: (r) => generatePixKey("email-masked", r),
};

export const MAX_MOCK_RECORDS = 10_000;

export function generateMockRecords(
  fields: { key: string; type: DataTypeId }[],
  count: number,
  rng: Rng = secureRng,
): Record<string, string>[] {
  const n = Math.min(Math.max(1, Math.floor(count) || 1), MAX_MOCK_RECORDS);
  return Array.from({ length: n }, () => Object.fromEntries(fields.map((f) => [f.key.trim(), GENERATORS[f.type](rng)])));
}

/** Array JSON formatado, pronto para copiar ou baixar. */
export function toFormattedJson(records: unknown[]): string {
  return JSON.stringify(records, null, 2);
}
