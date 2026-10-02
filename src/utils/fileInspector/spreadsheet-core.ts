import * as XLSX from "xlsx";
import type { SheetInfo } from "./types";
import { decodeDelimited } from "./text";

/** Núcleo de leitura de planilhas (SheetJS). Usado pelo Worker e, como alternativa, pela thread principal. */
export interface WorkbookHandle {
  sheets: SheetInfo[];
  getRows(sheetIndex: number, offset: number, limit: number): string[][];
}

/** Datas no padrão brasileiro (o padrão do SheetJS é o americano m/d/aa). */
const DATE_FORMAT = "dd/mm/yyyy";

const isDelimited = (name: string) => /\.(csv|tsv|txt)$/i.test(name);

export function openWorkbook(buffer: ArrayBuffer, filename: string): WorkbookHandle {
  let workbook: XLSX.WorkBook;
  if (isDelimited(filename)) {
    const { text, separator } = decodeDelimited(buffer);
    workbook = XLSX.read(text, { type: "string", FS: separator, raw: true, dense: true } as XLSX.ParsingOptions);
  } else {
    workbook = XLSX.read(buffer, { type: "array", cellDates: true, dense: true, dateNF: DATE_FORMAT });
  }

  const infos = workbook.SheetNames.map((name): SheetInfo & { origin: { r: number; c: number } } => {
    const ws = workbook.Sheets[name];
    const ref = ws["!ref"];
    if (!ref) return { name, rows: 0, cols: 0, origin: { r: 0, c: 0 } };
    const range = XLSX.utils.decode_range(ref);
    return { name, rows: range.e.r - range.s.r + 1, cols: range.e.c - range.s.c + 1, origin: range.s };
  });

  return {
    sheets: infos.map(({ name, rows, cols }) => ({ name, rows, cols })),
    getRows(sheetIndex, offset, limit) {
      const info = infos[sheetIndex];
      const ws = workbook.Sheets[info.name];
      if (!ws || info.rows === 0 || offset >= info.rows) return [];
      const lastRow = Math.min(info.rows - 1, offset + limit - 1);
      const rows = XLSX.utils.sheet_to_json<unknown[]>(ws, {
        header: 1,
        raw: false,
        dateNF: DATE_FORMAT,
        defval: "",
        blankrows: true,
        range: {
          s: { r: info.origin.r + offset, c: info.origin.c },
          e: { r: info.origin.r + lastRow, c: info.origin.c + info.cols - 1 },
        },
      });
      // Garante um array retangular (linhas curtas viram células vazias).
      return rows.map((row) => Array.from({ length: info.cols }, (_, c) => String((row as unknown[])[c] ?? "")));
    },
  };
}
