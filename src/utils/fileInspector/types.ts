export type FileKind = "spreadsheet" | "ofx" | "xml" | "json" | "pdf" | "image";

export interface SheetInfo {
  name: string;
  rows: number;
  cols: number;
}

export interface OfxTransaction {
  /** ISO (YYYY-MM-DD) ou null se a data não pôde ser lida. */
  date: string | null;
  type: string;
  amount: number;
  description: string;
  memo?: string;
  fitid?: string;
  checkNumber?: string;
}

export interface OfxBalance {
  amount: number;
  date: string | null;
}

export interface OfxData {
  header: Record<string, string>;
  institution: { org?: string; fid?: string };
  account: { bankId?: string; branchId?: string; accountId?: string; accountType?: string; currency?: string; kind: "bank" | "creditcard" | "unknown" };
  period: { start: string | null; end: string | null };
  ledgerBalance: OfxBalance | null;
  availableBalance: OfxBalance | null;
  transactions: OfxTransaction[];
  totals: { count: number; credits: number; debits: number };
  warnings: string[];
}
