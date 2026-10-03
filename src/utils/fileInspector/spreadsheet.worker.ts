/// <reference lib="webworker" />
import { openWorkbook, type WorkbookHandle } from "./spreadsheet-core";

/** Worker: lê a planilha fora da thread principal (a interface não trava em arquivos grandes). */
const ctx = self as unknown as {
  onmessage: ((event: MessageEvent) => void) | null;
  postMessage: (message: unknown) => void;
};

let handle: WorkbookHandle | null = null;

ctx.onmessage = (event: MessageEvent) => {
  const msg = event.data as
    | { id: number; type: "load"; buffer: ArrayBuffer; filename: string }
    | { id: number; type: "rows"; sheet: number; offset: number; limit: number };
  try {
    if (msg.type === "load") {
      handle = openWorkbook(msg.buffer, msg.filename);
      ctx.postMessage({ id: msg.id, ok: true, sheets: handle.sheets });
    } else if (handle) {
      ctx.postMessage({ id: msg.id, ok: true, rows: handle.getRows(msg.sheet, msg.offset, msg.limit) });
    } else {
      throw new Error("Spreadsheet not loaded.");
    }
  } catch (err) {
    ctx.postMessage({ id: msg.id, ok: false, error: err instanceof Error ? err.message : String(err) });
  }
};
