"use client";

import { useMemo, useRef, useState } from "react";
import { baseName, downloadBlob } from "@/utils/download";
import { buildOfx, ofxToBlob } from "@/utils/pdfToOfx";
import {
  ACCEPT,
  SheetReadError,
  buildTransactions,
  columnLabels,
  detectHeaderRow,
  headerCandidates,
  readSheets,
  suggestMapping,
  summarize,
  validAccountField,
  type AmountMode,
  type Mapping,
  type NumberFormat,
  type Workbook,
} from "@/utils/sheetToOfx";
import { trackEvent } from "@/lib/track";
import { MSG, errorMessage } from "@/lib/messages";
import Alert from "../ui/Alert";
import { Loading } from "../ui/Loading";
import { useToast } from "../ui/Toast";

const TOOL = "planilha-para-ofx";
const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const showDate = (iso: string) => iso.split("-").reverse().join("/");
const NONE = "";

interface Loaded {
  fileName: string;
  workbook: Workbook;
}

function ColumnSelect({ id, label, value, labels, optional, onChange }: {
  id: string;
  label: string;
  value: number | null;
  labels: string[];
  optional?: boolean;
  onChange: (v: number | null) => void;
}) {
  return (
    <div>
      <label htmlFor={id} className="label">{label}</label>
      <select id={id} className="input" value={value === null ? NONE : String(value)} onChange={(e) => onChange(e.target.value === NONE ? null : Number(e.target.value))}>
        <option value={NONE}>{optional ? "Nenhuma" : "Selecione a coluna"}</option>
        {labels.map((l, i) => (
          <option key={i} value={i}>{l}</option>
        ))}
      </select>
    </div>
  );
}

export default function SheetToOfxConverter() {
  const toast = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isReading, setIsReading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState<Loaded | null>(null);

  const [sheetIndex, setSheetIndex] = useState(0);
  const [headerRow, setHeaderRow] = useState(-1);
  const [mapping, setMapping] = useState<Mapping>({ date: null, description: null, amount: null, debit: null, credit: null });
  const [amountMode, setAmountMode] = useState<AmountMode>("single");
  const [numberFormat, setNumberFormat] = useState<NumberFormat>("auto");
  const [invertSign, setInvertSign] = useState(false);
  const [bankId, setBankId] = useState("");
  const [accountId, setAccountId] = useState("");

  const sheet = loaded?.workbook.sheets[sheetIndex];
  const labels = useMemo(() => (sheet ? columnLabels(sheet, headerRow) : []), [sheet, headerRow]);
  const candidates = useMemo(() => (sheet ? headerCandidates(sheet) : []), [sheet]);

  /** Aplica a sugestão de mapeamento (pelo cabeçalho e pelo conteúdo das colunas) para a aba/linha de cabeçalho atuais. */
  const applySuggestion = (nextSheet: typeof sheet, header: number, book: Workbook | undefined = loaded?.workbook) => {
    if (!nextSheet) return;
    const m = suggestMapping(nextSheet, header, book?.serialToParts);
    setMapping(m);
    setAmountMode(m.amount === null && (m.debit !== null || m.credit !== null) ? "split" : "single");
  };

  const open = async (file: File | undefined) => {
    if (!file || isReading) return;
    setIsReading(true);
    setError(null);
    try {
      const workbook = await readSheets(file);
      const first = workbook.sheets[0];
      // A tabela pode começar depois de títulos e dados da conta: acha a linha do cabeçalho pelo conteúdo.
      const header = detectHeaderRow(first, workbook.serialToParts);
      setLoaded({ fileName: file.name, workbook });
      setSheetIndex(0);
      setHeaderRow(header);
      setNumberFormat("auto");
      setInvertSign(false);
      applySuggestion(first, header, workbook);
    } catch (err) {
      const message = err instanceof SheetReadError ? err.message : errorMessage(err, MSG.sheetOfx.readFailed);
      setError(message);
      toast.error(message);
    } finally {
      setIsReading(false);
    }
  };

  const chosen = (amountMode === "single" ? [mapping.date, mapping.description, mapping.amount] : [mapping.date, mapping.description, mapping.debit, mapping.credit]).filter(
    (c): c is number => c !== null,
  );
  const hasDuplicates = new Set(chosen).size !== chosen.length;
  const hasAmount = amountMode === "single" ? mapping.amount !== null : mapping.debit !== null || mapping.credit !== null;
  const ready = Boolean(sheet) && mapping.date !== null && hasAmount && !hasDuplicates;

  const built = useMemo(() => {
    if (!sheet || !loaded || !ready) return null;
    return buildTransactions({ sheet, headerRow, mapping, amountMode, numberFormat, invertSign, serialToParts: loaded.workbook.serialToParts });
  }, [sheet, loaded, ready, headerRow, mapping, amountMode, numberFormat, invertSign]);

  // O que ainda falta para liberar o download (sempre dito na tela, nunca um beco sem saída).
  const missing: string[] = [];
  if (mapping.date === null) missing.push("a coluna de Data");
  if (!hasAmount) missing.push(amountMode === "single" ? "a coluna de Valor" : "a coluna de Débito ou Crédito");
  const skipReasons = built
    ? Object.entries(built.skipped.reduce<Record<string, number>>((acc, r) => ({ ...acc, [r.reason]: (acc[r.reason] ?? 0) + 1 }), {}))
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([reason, n]) => `${n.toLocaleString("pt-BR")} com ${reason}`)
        .join(", ")
    : "";

  const summary = built ? summarize(built.transactions) : null;
  const accountOk = validAccountField(bankId) && validAccountField(accountId);

  const generate = () => {
    if (!built || !loaded || built.transactions.length === 0) return;
    if (!accountOk) {
      toast.error(MSG.sheetOfx.invalidAccount);
      return;
    }
    const ofx = buildOfx(built.transactions, { bankId: bankId || undefined, accountId: accountId || undefined });
    downloadBlob(ofxToBlob(ofx), `${baseName(loaded.fileName)}.ofx`);
    toast.success(MSG.sheetOfx.generated(built.transactions.length));
    trackEvent(TOOL, "use", "spreadsheet");
  };

  const reset = () => {
    setLoaded(null);
    setError(null);
  };

  return (
    <div className="space-y-6">
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        className="hidden"
        data-testid="sheet-input"
        onChange={(e) => {
          void open(e.target.files?.[0]);
          e.target.value = "";
        }}
      />

      {error && <Alert variant="error">{error}</Alert>}

      {!loaded ? (
        <div
          role="button"
          tabIndex={0}
          onClick={() => inputRef.current?.click()}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              inputRef.current?.click();
            }
          }}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
            void open(e.dataTransfer.files?.[0]);
          }}
          className={`card group flex min-h-[16rem] cursor-pointer flex-col items-center justify-center border-2 border-dashed px-6 py-12 text-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-700/40 ${
            isDragging ? "border-teal-600 bg-teal-50" : "border-stone-300 hover:border-teal-600 hover:bg-teal-50/50"
          }`}
        >
          {isReading ? (
            <Loading>Lendo a planilha…</Loading>
          ) : (
            <>
              <svg className="mb-4 h-10 w-10 text-stone-400 group-hover:text-teal-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 10h18M3 14h18M10 4v16M6 4h12a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2z" />
              </svg>
              <p className="mb-1 text-lg font-semibold text-stone-900">{isDragging ? "Solte a planilha para começar" : "Arraste a planilha aqui"}</p>
              <p className="mb-5 text-sm text-stone-600">ou clique para escolher no computador</p>
              <p className="mb-2 text-xs text-stone-500">CSV, XLSX, XLS ou ODS, até 20 MB</p>
              <p className="text-xs font-medium text-teal-800">100% local: a planilha nunca sai do seu navegador.</p>
            </>
          )}
        </div>
      ) : (
        <>
          <div className="card flex flex-wrap items-center gap-x-4 gap-y-3 p-4">
            <span className="min-w-0 truncate font-medium text-stone-900" title={loaded.fileName} data-testid="sheet-file-name">{loaded.fileName}</span>
            {loaded.workbook.sheets.length > 1 && (
              <div className="flex items-center gap-2">
                <label htmlFor="sheet-pick" className="text-sm text-stone-600">Aba</label>
                <select
                  id="sheet-pick"
                  className="input !w-auto !py-1.5"
                  value={sheetIndex}
                  onChange={(e) => {
                    const i = Number(e.target.value);
                    setSheetIndex(i);
                    const nextSheet = loaded.workbook.sheets[i];
                    const header = detectHeaderRow(nextSheet, loaded.workbook.serialToParts);
                    setHeaderRow(header);
                    applySuggestion(nextSheet, header);
                  }}
                >
                  {loaded.workbook.sheets.map((s, i) => (
                    <option key={s.name} value={i}>{s.name}</option>
                  ))}
                </select>
              </div>
            )}
            <div className="flex items-center gap-2">
              <label htmlFor="header-row" className="text-sm text-stone-600">Linha do cabeçalho</label>
              <select
                id="header-row"
                className="input !w-auto max-w-[18rem] !py-1.5"
                value={headerRow}
                onChange={(e) => {
                  const row = Number(e.target.value);
                  setHeaderRow(row);
                  applySuggestion(sheet, row);
                }}
              >
                <option value={-1}>Sem cabeçalho</option>
                {candidates.map((i) => (
                  <option key={i} value={i}>
                    Linha {sheet!.firstRow + i}: {sheet!.rows[i].filter((c) => String(c ?? "").trim() !== "").slice(0, 3).join(", ").slice(0, 40)}
                  </option>
                ))}
              </select>
            </div>
            <button className="btn-secondary btn-sm ml-auto" onClick={reset}>Trocar arquivo</button>
          </div>

          <section className="card p-6" aria-labelledby="map-title">
            <h2 id="map-title" className="section-title mb-1">1. Mapeamento de colunas</h2>
            <p className="mb-5 text-sm text-stone-600">Diga qual coluna da planilha é cada informação do extrato.</p>

            <div className="grid gap-4 sm:grid-cols-2">
              <ColumnSelect id="col-date" label="Data" value={mapping.date} labels={labels} onChange={(v) => setMapping((m) => ({ ...m, date: v }))} />
              <ColumnSelect id="col-desc" label="Descrição" value={mapping.description} labels={labels} optional onChange={(v) => setMapping((m) => ({ ...m, description: v }))} />
              {amountMode === "single" ? (
                <ColumnSelect id="col-amount" label="Valor (saídas negativas)" value={mapping.amount} labels={labels} onChange={(v) => setMapping((m) => ({ ...m, amount: v }))} />
              ) : (
                <>
                  <ColumnSelect id="col-debit" label="Débito (saída)" value={mapping.debit} labels={labels} optional onChange={(v) => setMapping((m) => ({ ...m, debit: v }))} />
                  <ColumnSelect id="col-credit" label="Crédito (entrada)" value={mapping.credit} labels={labels} optional onChange={(v) => setMapping((m) => ({ ...m, credit: v }))} />
                </>
              )}
            </div>

            <div className="mt-5 grid gap-4 border-t border-stone-200 pt-5 sm:grid-cols-2">
              <div>
                <label htmlFor="amount-mode" className="label">Como os valores aparecem</label>
                <select id="amount-mode" className="input" value={amountMode} onChange={(e) => setAmountMode(e.target.value as AmountMode)}>
                  <option value="single">Uma coluna de valor (com sinal)</option>
                  <option value="split">Colunas separadas de débito e crédito</option>
                </select>
              </div>
              <div>
                <label htmlFor="number-format" className="label">Formato dos números</label>
                <select id="number-format" className="input" value={numberFormat} onChange={(e) => setNumberFormat(e.target.value as NumberFormat)}>
                  <option value="auto">Automático{built ? ` (detectado: ${built.format === "br" ? "1.234,56" : "1,234.56"})` : ""}</option>
                  <option value="br">Brasileiro: 1.234,56</option>
                  <option value="us">Internacional: 1,234.56</option>
                </select>
              </div>
              <label className="flex items-center gap-2 text-sm text-stone-700 sm:col-span-2">
                <input type="checkbox" className="h-4 w-4 accent-teal-700" checked={invertSign} onChange={(e) => setInvertSign(e.target.checked)} />
                Inverter o sinal dos valores (útil em faturas de cartão, em que as compras aparecem positivas)
              </label>
            </div>

            {hasDuplicates && <Alert variant="warning" className="mt-5">{MSG.sheetOfx.duplicateColumns}</Alert>}
          </section>

          <section className="card p-6" aria-labelledby="acc-title">
            <h2 id="acc-title" className="section-title mb-1">2. Dados da conta (opcional)</h2>
            <p className="mb-5 text-sm text-stone-600">Alguns sistemas pedem o banco e a conta no OFX. Se deixar em branco, usamos valores genéricos.</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="bank-id" className="label">Código do banco</label>
                <input id="bank-id" className="input" value={bankId} maxLength={22} placeholder="Ex.: 260" onChange={(e) => setBankId(e.target.value.trim())} />
              </div>
              <div>
                <label htmlFor="account-id" className="label">Número da conta</label>
                <input id="account-id" className="input" value={accountId} maxLength={22} placeholder="Ex.: 12345-6" onChange={(e) => setAccountId(e.target.value.trim())} />
              </div>
            </div>
            {!accountOk && <Alert variant="warning" className="mt-4">{MSG.sheetOfx.invalidAccount}</Alert>}
          </section>

          <section className="card p-6" aria-labelledby="check-title">
            <h2 id="check-title" className="section-title mb-1">3. Conferência e download</h2>
            {missing.length > 0 && (
              <Alert variant="warning" className="mt-4">
                Falta escolher {missing.join(" e ")}.{" "}
                <a href="#map-title" className="font-medium underline">Ir para o mapeamento</a>
              </Alert>
            )}
            {hasDuplicates && missing.length === 0 && (
              <Alert variant="warning" className="mt-4">{MSG.sheetOfx.duplicateColumns}</Alert>
            )}

            {ready && built && (
              <>
                {summary ? (
                  <dl className="mb-5 mt-4 grid gap-4 sm:grid-cols-4" data-testid="sheet-summary">
                    {[
                      ["Lançamentos", summary.count.toLocaleString("pt-BR")],
                      ["Período", `${showDate(summary.from)} a ${showDate(summary.to)}`],
                      ["Entradas", brl.format(summary.inflow)],
                      ["Saídas", brl.format(summary.outflow)],
                    ].map(([k, v]) => (
                      <div key={k}>
                        <dt className="text-xs text-stone-500">{k}</dt>
                        <dd className="text-sm font-semibold text-stone-900">{v}</dd>
                      </div>
                    ))}
                  </dl>
                ) : (
                  <Alert variant="warning" className="mt-4">
                    Nenhuma linha válida com este mapeamento{skipReasons ? ` (${skipReasons})` : ""}. Confira a linha do cabeçalho e as colunas de data e valor.
                  </Alert>
                )}

                {built.transactions.length > 0 && (
                  <div className="mb-5 overflow-x-auto rounded-md border border-stone-200">
                    <table className="w-full min-w-[32rem] text-sm">
                      <thead className="border-b border-stone-200 bg-stone-50">
                        <tr>
                          <th className="table-th">Data</th>
                          <th className="table-th">Descrição</th>
                          <th className="table-th text-right">Valor</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-100">
                        {built.transactions.slice(0, 5).map((t, i) => (
                          <tr key={i}>
                            <td className="table-td font-mono text-xs">{showDate(t.date)}</td>
                            <td className="table-td max-w-[20rem] truncate">{t.description}</td>
                            <td className={`table-td text-right font-mono text-xs ${t.amount < 0 ? "text-red-700" : "text-teal-800"}`}>{brl.format(t.amount)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {built.transactions.length > 5 && <p className="border-t border-stone-200 px-4 py-2 text-xs text-stone-500">Mostrando 5 de {built.transactions.length.toLocaleString("pt-BR")} lançamentos.</p>}
                  </div>
                )}

                {built.skipped.length > 0 && (
                  <Alert variant="warning" title={`${built.skipped.length.toLocaleString("pt-BR")} linha${built.skipped.length === 1 ? "" : "s"} ignorada${built.skipped.length === 1 ? "" : "s"}`} className="mb-5">
                    <span data-testid="sheet-skipped">
                      {built.skipped.slice(0, 5).map((r) => `linha ${r.row} (${r.reason})`).join("; ")}
                      {built.skipped.length > 5 ? "…" : "."} Elas não entram no OFX.
                    </span>
                  </Alert>
                )}
              </>
            )}

            <button
              className="btn-primary mt-4 px-5 py-3"
              onClick={generate}
              disabled={!built || built.transactions.length === 0 || !accountOk}
              data-testid="sheet-generate"
            >
              Gerar OFX e baixar
            </button>
          </section>
        </>
      )}
    </div>
  );
}
