"use client";

import { useEffect, useRef, useState } from "react";
import type { SpreadsheetEngine } from "@/utils/fileInspector/spreadsheet";
import { columnLabel, formatNumber } from "@/utils/fileInspector/format";
import { useI18n } from "@/i18n/I18nProvider";
import { BAR, BTN, DIM, TABLIST, tabClass } from "./ui";

const ROW_H = 30;
const HEADER_H = 32;
const PAGE = 100; // linhas por bloco buscado no worker
const OVERSCAN = 15;
const COL_W = 176;
const GUTTER_W = 56;
const MAX_COLS = 300;
const VIEW_H = 448;

interface GridProps {
  engine: SpreadsheetEngine;
  sheetIndex: number;
  onCopy: (text: string, label: string) => void;
}

/** Grade virtualizada: só as linhas visíveis existem no DOM e os dados chegam do worker em blocos. */
function SheetGrid({ engine, sheetIndex, onCopy }: GridProps) {
  const { t } = useI18n();
  const sheet = engine.sheets[sheetIndex];
  const cols = Math.min(sheet.cols, MAX_COLS);
  const [scrollTop, setScrollTop] = useState(0);
  const [selected, setSelected] = useState<{ row: number; col: number } | null>(null);
  const [, bump] = useState(0);
  const cache = useRef(new Map<number, string[][]>());
  const inflight = useRef(new Set<number>());
  const raf = useRef<number | null>(null);

  const first = Math.max(0, Math.floor(scrollTop / ROW_H) - OVERSCAN);
  const last = Math.min(sheet.rows - 1, Math.ceil((scrollTop + VIEW_H) / ROW_H) + OVERSCAN);
  const firstPage = Math.floor(first / PAGE);
  const lastPage = Math.floor(Math.max(last, 0) / PAGE);

  useEffect(() => {
    if (sheet.rows === 0) return;
    let cancelled = false;
    for (let page = firstPage; page <= lastPage; page++) {
      if (cache.current.has(page) || inflight.current.has(page)) continue;
      inflight.current.add(page);
      engine
        .getRows(sheetIndex, page * PAGE, PAGE)
        .then((rows) => {
          cache.current.set(page, rows);
          if (!cancelled) bump((n) => n + 1);
        })
        .catch(() => cache.current.set(page, []))
        .finally(() => inflight.current.delete(page));
    }
    return () => {
      cancelled = true;
    };
  }, [engine, sheetIndex, sheet.rows, firstPage, lastPage]);

  useEffect(() => () => {
    if (raf.current) cancelAnimationFrame(raf.current);
  }, []);

  const cell = (row: number, col: number) => cache.current.get(Math.floor(row / PAGE))?.[row % PAGE]?.[col];
  const template = `${GUTTER_W}px repeat(${cols}, ${COL_W}px)`;
  const width = GUTTER_W + cols * COL_W;

  if (sheet.rows === 0 || sheet.cols === 0) {
    return <div className={`px-4 py-12 text-center text-sm ${DIM}`}>{t("tools.inspector.sheetEmpty")}</div>;
  }

  const selectedValue = selected ? cell(selected.row, selected.col) : undefined;
  const rows: React.ReactNode[] = [];
  for (let r = first; r <= last; r++) {
    const loaded = cache.current.get(Math.floor(r / PAGE))?.[r % PAGE];
    rows.push(
      <div
        key={r}
        data-row={r + 1}
        className="absolute left-0 grid border-b border-stone-100 hover:bg-stone-50"
        style={{ top: HEADER_H + r * ROW_H, height: ROW_H, width, gridTemplateColumns: template }}
      >
        <div className="sticky left-0 z-10 border-r border-stone-200 bg-stone-50 px-2 text-right text-xs leading-[30px] text-stone-400">{r + 1}</div>
        {Array.from({ length: cols }, (_, c) => {
          const isSelected = selected?.row === r && selected.col === c;
          return (
            <div
              key={c}
              onClick={() => setSelected({ row: r, col: c })}
              className={`cursor-cell truncate border-r border-stone-100 px-2.5 text-[13px] leading-[30px] ${
                isSelected ? "bg-teal-50 text-teal-900 outline outline-2 -outline-offset-2 outline-teal-600" : "text-stone-800"
              }`}
              title={loaded?.[c]}
            >
              {loaded ? loaded[c] : <span className="text-stone-300">…</span>}
            </div>
          );
        })}
      </div>,
    );
  }

  return (
    <div>
      <div className={`${BAR} min-h-[49px]`} data-testid="formula-bar">
        {selected ? (
          <>
            <span className="badge-brand font-mono">{columnLabel(selected.col)}{selected.row + 1}</span>
            <span className="min-w-0 flex-1 truncate text-stone-800" title={selectedValue}>{selectedValue ?? "…"}</span>
            <button className={BTN} disabled={selectedValue === undefined} onClick={() => onCopy(selectedValue ?? "", t("tools.inspector.cellCopied"))}>
              {t("tools.inspector.copyCell")}
            </button>
          </>
        ) : (
          <span className={DIM}>{t("tools.inspector.clickCell")}</span>
        )}
      </div>
      <div
        data-testid="sheet-scroll"
        className="overflow-auto bg-white"
        style={{ height: VIEW_H }}
        onScroll={(e) => {
          const top = e.currentTarget.scrollTop;
          if (raf.current) cancelAnimationFrame(raf.current);
          raf.current = requestAnimationFrame(() => setScrollTop(top));
        }}
      >
        <div className="relative" style={{ width, height: HEADER_H + sheet.rows * ROW_H }}>
          <div
            className="sticky top-0 z-20 grid border-b border-stone-300 bg-stone-100 text-xs font-medium text-stone-500"
            style={{ height: HEADER_H, width, gridTemplateColumns: template }}
          >
            <div className="sticky left-0 z-30 border-r border-stone-200 bg-stone-100" />
            {Array.from({ length: cols }, (_, c) => (
              <div key={c} className="border-r border-stone-200 px-2 text-center leading-[32px]">{columnLabel(c)}</div>
            ))}
          </div>
          {rows}
        </div>
      </div>
      {sheet.cols > MAX_COLS && (
        <p className={`border-t border-stone-200 px-4 py-2 text-xs ${DIM}`}>{t("tools.inspector.firstCols", { max: MAX_COLS, total: formatNumber(sheet.cols) })}</p>
      )}
    </div>
  );
}

export default function SpreadsheetViewer({ engine, onCopy }: { engine: SpreadsheetEngine; onCopy: (text: string, label: string) => void }) {
  const { t } = useI18n();
  const [sheetIndex, setSheetIndex] = useState(0);
  const sheet = engine.sheets[sheetIndex];

  return (
    <div>
      <div role="tablist" aria-label={t("tools.inspector.sheetsAria")} className={TABLIST}>
        {engine.sheets.map((s, i) => (
          <button key={`${s.name}-${i}`} role="tab" aria-selected={i === sheetIndex} onClick={() => setSheetIndex(i)} className={tabClass(i === sheetIndex)}>
            {s.name}
          </button>
        ))}
      </div>
      <div className={`${BAR} ${DIM}`} data-testid="sheet-stats">
        <span>{t("tools.inspector.sheetLabel")} <span className="font-medium text-stone-900">{sheet.name}</span></span>
        <span><span className="font-medium text-stone-900">{formatNumber(sheet.rows)}</span> {t("tools.inspector.rows")}</span>
        <span><span className="font-medium text-stone-900">{formatNumber(sheet.cols)}</span> {t("tools.inspector.cols")}</span>
        <span className="text-xs">{t("tools.inspector.processedIn")} {engine.mode === "worker" ? t("tools.inspector.worker") : t("tools.inspector.mainThread")}</span>
      </div>
      <SheetGrid key={sheetIndex} engine={engine} sheetIndex={sheetIndex} onCopy={onCopy} />
    </div>
  );
}
