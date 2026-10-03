import { activeTranslator } from "@/i18n/active";
import type { SheetInfo } from "./types";

export interface SpreadsheetEngine {
  sheets: SheetInfo[];
  /** Onde a planilha foi processada. */
  mode: "worker" | "main";
  getRows(sheetIndex: number, offset: number, limit: number): Promise<string[][]>;
  dispose(): void;
}

export class SpreadsheetParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SpreadsheetParseError";
  }
}

class WorkerUnavailableError extends Error {}

function createWorkerEngine(buffer: ArrayBuffer, filename: string): Promise<SpreadsheetEngine> {
  return new Promise((resolve, reject) => {
    let worker: Worker;
    try {
      worker = new Worker(new URL("./spreadsheet.worker.ts", import.meta.url), { type: "module" });
    } catch {
      reject(new WorkerUnavailableError("Worker indisponível"));
      return;
    }

    let nextId = 1;
    const pending = new Map<number, { resolve: (v: unknown) => void; reject: (e: Error) => void }>();
    const send = <T,>(message: Record<string, unknown>, transfer: Transferable[] = []) =>
      new Promise<T>((res, rej) => {
        const id = nextId++;
        pending.set(id, { resolve: res as (v: unknown) => void, reject: rej });
        worker.postMessage({ id, ...message }, transfer);
      });

    worker.onmessage = (event: MessageEvent) => {
      const { id, ok, error, ...payload } = event.data as { id: number; ok: boolean; error?: string } & Record<string, unknown>;
      const entry = pending.get(id);
      if (!entry) return;
      pending.delete(id);
      if (ok) entry.resolve(payload);
      else entry.reject(new SpreadsheetParseError(error ?? activeTranslator().t("tools.inspector.sheetFailed")));
    };
    // Falha ao carregar o script do worker (CSP, bundler, navegador antigo): usa a thread principal.
    worker.onerror = () => {
      worker.terminate();
      pending.forEach((p) => p.reject(new WorkerUnavailableError("Worker falhou")));
      pending.clear();
    };

    send<{ sheets: SheetInfo[] }>({ type: "load", buffer, filename }, [buffer])
      .then(({ sheets }) =>
        resolve({
          sheets,
          mode: "worker",
          getRows: (sheet, offset, limit) => send<{ rows: string[][] }>({ type: "rows", sheet, offset, limit }).then((r) => r.rows),
          dispose: () => {
            worker.terminate();
            pending.clear();
          },
        }),
      )
      .catch((err) => {
        worker.terminate();
        reject(err);
      });
  });
}

async function createMainEngine(buffer: ArrayBuffer, filename: string): Promise<SpreadsheetEngine> {
  const { openWorkbook } = await import("./spreadsheet-core");
  try {
    const handle = openWorkbook(buffer, filename);
    return {
      sheets: handle.sheets,
      mode: "main",
      getRows: async (sheet, offset, limit) => handle.getRows(sheet, offset, limit),
      dispose: () => {},
    };
  } catch (err) {
    throw new SpreadsheetParseError(err instanceof Error ? err.message : activeTranslator().t("tools.inspector.sheetFailed"));
  }
}

/** Abre a planilha em um Web Worker; se o worker não estiver disponível, processa na thread principal. */
export async function createSpreadsheetEngine(file: File): Promise<SpreadsheetEngine> {
  if (typeof Worker !== "undefined") {
    try {
      return await createWorkerEngine(await file.arrayBuffer(), file.name);
    } catch (err) {
      if (!(err instanceof WorkerUnavailableError)) throw err; // erro de leitura do arquivo: não adianta repetir
    }
  }
  return createMainEngine(await file.arrayBuffer(), file.name);
}
