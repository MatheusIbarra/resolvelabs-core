"use client";

import { Link } from "@/i18n/navigation";
import { useI18n } from "@/i18n/I18nProvider";
import { INTL_LOCALE } from "@/i18n/config";
import { isoPartsToLocal } from "@/utils/fileInspector/format";
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
import { errorMessage } from "@/lib/messages";
import Alert from "../ui/Alert";
import { Loading } from "../ui/Loading";
import { useToast } from "../ui/Toast";

const TOOL = "planilha-para-ofx";
const showDate = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  return isoPartsToLocal(y, m, d);
};
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
  const { t } = useI18n();
  return (
    <div>
      <label htmlFor={id} className="label">{label}</label>
      <select id={id} className="input" value={value === null ? NONE : String(value)} onChange={(e) => onChange(e.target.value === NONE ? null : Number(e.target.value))}>
        <option value={NONE}>{optional ? t("tools.sheet.none") : t("tools.sheet.selectColumn")}</option>
        {labels.map((l, i) => (
          <option key={i} value={i}>{l}</option>
        ))}
      </select>
    </div>
  );
}

export default function SheetToOfxConverter() {
  const { t, tn, locale, number } = useI18n();
  const brl = useMemo(() => new Intl.NumberFormat(INTL_LOCALE[locale], { style: "currency", currency: "BRL" }), [locale]);
  const toast = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isReading, setIsReading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  /** Quando o arquivo é de outro tipo (ex.: PDF), indica a ferramenta certa. */
  const [errorHint, setErrorHint] = useState<{ href: string; label: string } | null>(null);
  const [loaded, setLoaded] = useState<Loaded | null>(null);

  const [sheetIndex, setSheetIndex] = useState(0);
  const [headerRow, setHeaderRow] = useState(-1);
  const [mapping, setMapping] = useState<Mapping>({ date: null, description: null, amount: null, debit: null, credit: null, type: null });
  const [amountMode, setAmountMode] = useState<AmountMode>("single");
  const [numberFormat, setNumberFormat] = useState<NumberFormat>("auto");
  const [invertSign, setInvertSign] = useState(false);
  /** Nenhuma coluna de datas foi reconhecida: provavelmente não é uma planilha de movimentações (mas não travamos: dá para usar data fixa). */
  const [unrecognized, setUnrecognized] = useState(false);
  // Sem coluna de data: todos os lançamentos recebem uma data fixa. Datas sem ano (15/01) usam o ano escolhido.
  const today = useMemo(() => new Date(), []);
  const [useFixedDate, setUseFixedDate] = useState(false);
  const [fixedDate, setFixedDate] = useState(() => `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`);
  const [defaultYear, setDefaultYear] = useState(today.getFullYear());
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
    setUnrecognized(m.date === null);
    setUseFixedDate(m.date === null); // sem coluna de data não travamos: usa uma data fixa
    setAmountMode(m.amount === null && (m.debit !== null || m.credit !== null) ? "split" : "single");
  };

  const open = async (file: File | undefined) => {
    if (!file || isReading) return;
    setIsReading(true);
    setError(null);
    setErrorHint(null);
    try {
      if (/\.pdf$/i.test(file.name)) {
        setErrorHint({ href: "/ferramentas/conversor-pdf-para-ofx", label: t("tools.sheet.pdfHint") });
        throw new SheetReadError(t("tools.sheet.pdfError"));
      }
      if (/\.ofx$/i.test(file.name)) {
        setErrorHint({ href: "/ferramentas/visualizador-ofx", label: t("tools.sheet.ofxHint") });
        throw new SheetReadError(t("tools.sheet.ofxError"));
      }
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
      const message = err instanceof SheetReadError ? err.message : errorMessage(err, t("msg.sheetOfx.readFailed"));
      setError(message);
      toast.error(message);
    } finally {
      setIsReading(false);
    }
  };

  const dateOk = useFixedDate ? fixedDate !== "" : mapping.date !== null;
  const chosen = (amountMode === "single" ? [mapping.date, mapping.description, mapping.amount, mapping.type] : [mapping.date, mapping.description, mapping.debit, mapping.credit]).filter(
    (c): c is number => c !== null,
  );
  const hasDuplicates = new Set(chosen).size !== chosen.length;
  const hasAmount = amountMode === "single" ? mapping.amount !== null : mapping.debit !== null || mapping.credit !== null;
  const ready = Boolean(sheet) && dateOk && hasAmount && !hasDuplicates;

  const built = useMemo(() => {
    if (!sheet || !loaded || !ready) return null;
    return buildTransactions({
      sheet,
      headerRow,
      mapping: useFixedDate ? { ...mapping, date: null } : mapping,
      amountMode,
      numberFormat,
      invertSign,
      serialToParts: loaded.workbook.serialToParts,
      fixedDate: useFixedDate ? fixedDate : undefined,
      defaultYear,
    });
  }, [sheet, loaded, ready, headerRow, mapping, amountMode, numberFormat, invertSign, useFixedDate, fixedDate, defaultYear]);

  // Há datas escritas sem ano (15/01)? Então perguntamos o ano.
  const hasYearless = useMemo(() => {
    const col = mapping.date;
    if (!sheet || col === null || useFixedDate) return false;
    return sheet.rows.slice(headerRow + 1, headerRow + 200).some((r) => /^\s*\d{1,2}[/.-]\d{1,2}\s*$/.test(String(r[col] ?? "")));
  }, [sheet, mapping.date, useFixedDate, headerRow]);

  // O que ainda falta para liberar o download (sempre dito na tela, nunca um beco sem saída).
  const reasonText = (reason: string) =>
    reason === "invalid-date" ? t("tools.sheet.reasonDate") : reason === "invalid-amount" ? t("tools.sheet.reasonAmount") : t("tools.sheet.reasonRange");
  const missing: string[] = [];
  if (!dateOk) missing.push(t("tools.sheet.missingDate"));
  if (!hasAmount) missing.push(amountMode === "single" ? t("tools.sheet.missingAmount") : t("tools.sheet.missingSplit"));
  const skipReasons = built
    ? Object.entries(built.skipped.reduce<Record<string, number>>((acc, r) => ({ ...acc, [r.reason]: (acc[r.reason] ?? 0) + 1 }), {}))
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([reason, n]) => t("tools.sheet.skipCount", { n: number(n), reason: reasonText(reason) }))
        .join(", ")
    : "";

  const summary = built ? summarize(built.transactions) : null;
  const accountOk = validAccountField(bankId) && validAccountField(accountId);

  const generate = () => {
    if (!built || !loaded || built.transactions.length === 0) return;
    if (!accountOk) {
      toast.error(t("msg.sheetOfx.invalidAccount"));
      return;
    }
    const ofx = buildOfx(built.transactions, { bankId: bankId || undefined, accountId: accountId || undefined });
    downloadBlob(ofxToBlob(ofx), `${baseName(loaded.fileName)}.ofx`);
    toast.success(tn("msg.sheetOfx.generated", built.transactions.length));
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

      {error && (
        <Alert
          variant="error"
          action={errorHint ? <Link href={errorHint.href} className="btn-secondary btn-sm">{errorHint.label}</Link> : undefined}
        >
          {error}
        </Alert>
      )}

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
            <Loading>{t("tools.sheet.reading")}</Loading>
          ) : (
            <>
              <svg className="mb-4 h-10 w-10 text-stone-400 group-hover:text-teal-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 10h18M3 14h18M10 4v16M6 4h12a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2z" />
              </svg>
              <p className="mb-1 text-lg font-semibold text-stone-900">{isDragging ? t("tools.sheet.drop") : t("tools.sheet.dropHere")}</p>
              <p className="mb-5 text-sm text-stone-600">{t("tools.sheet.orClick")}</p>
              <p className="mb-2 text-xs text-stone-500">{t("tools.sheet.accepts")}</p>
              <p className="text-xs font-medium text-teal-800">{t("tools.sheet.local")}</p>
            </>
          )}
        </div>
      ) : (
        <>
          <div className="card flex flex-wrap items-center gap-x-4 gap-y-3 p-4">
            <span className="min-w-0 truncate font-medium text-stone-900" title={loaded.fileName} data-testid="sheet-file-name">{loaded.fileName}</span>
            {loaded.workbook.sheets.length > 1 && (
              <div className="flex items-center gap-2">
                <label htmlFor="sheet-pick" className="text-sm text-stone-600">{t("tools.sheet.sheetTab")}</label>
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
              <label htmlFor="header-row" className="text-sm text-stone-600">{t("tools.sheet.headerRow")}</label>
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
                <option value={-1}>{t("tools.sheet.noHeader")}</option>
                {candidates.map((i) => (
                  <option key={i} value={i}>
                    {t("tools.sheet.rowN", { n: sheet!.firstRow + i, sample: sheet!.rows[i].filter((c) => String(c ?? "").trim() !== "").slice(0, 3).join(", ").slice(0, 40) })}
                  </option>
                ))}
              </select>
            </div>
            <button className="btn-secondary btn-sm ml-auto" onClick={reset}>{t("tools.sheet.swap")}</button>
          </div>

          <section className="card p-6" aria-labelledby="map-title">
            <h2 id="map-title" className="section-title mb-1">{t("tools.sheet.step1")}</h2>
            <p className="mb-5 text-sm text-stone-600">{t("tools.sheet.step1Hint")}</p>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="col-date" className="label">{t("tools.sheet.date")}</label>
                <select
                  id="col-date"
                  className="input"
                  value={useFixedDate ? "fixed" : mapping.date === null ? "" : String(mapping.date)}
                  onChange={(e) => {
                    if (e.target.value === "fixed") setUseFixedDate(true);
                    else {
                      setUseFixedDate(false);
                      setMapping((m) => ({ ...m, date: e.target.value === "" ? null : Number(e.target.value) }));
                    }
                  }}
                >
                  <option value="">{t("tools.sheet.selectColumn")}</option>
                  {labels.map((l, i) => (
                    <option key={i} value={i}>{l}</option>
                  ))}
                  <option value="fixed">{t("tools.sheet.fixedDate")}</option>
                </select>
                {useFixedDate && (
                  <input type="date" aria-label={t("tools.sheet.fixedDateAria")} className="input mt-2" value={fixedDate} onChange={(e) => setFixedDate(e.target.value)} />
                )}
                {hasYearless && (
                  <div className="mt-2 flex items-center gap-2 text-sm text-stone-600">
                    <label htmlFor="default-year">{t("tools.sheet.yearless")}</label>
                    <input id="default-year" type="number" min={1990} max={2100} className="input !w-24 !py-1.5" value={defaultYear} onChange={(e) => setDefaultYear(Number(e.target.value) || today.getFullYear())} />
                  </div>
                )}
              </div>
              <ColumnSelect id="col-desc" label={t("tools.sheet.description")} value={mapping.description} labels={labels} optional onChange={(v) => setMapping((m) => ({ ...m, description: v }))} />
              {amountMode === "single" ? (
                <>
                  <ColumnSelect id="col-amount" label={t("tools.sheet.amount")} value={mapping.amount} labels={labels} onChange={(v) => setMapping((m) => ({ ...m, amount: v }))} />
                  <ColumnSelect id="col-type" label={t("tools.sheet.typeCol")} value={mapping.type} labels={labels} optional onChange={(v) => setMapping((m) => ({ ...m, type: v }))} />
                </>
              ) : (
                <>
                  <ColumnSelect id="col-debit" label={t("tools.sheet.debit")} value={mapping.debit} labels={labels} optional onChange={(v) => setMapping((m) => ({ ...m, debit: v }))} />
                  <ColumnSelect id="col-credit" label={t("tools.sheet.credit")} value={mapping.credit} labels={labels} optional onChange={(v) => setMapping((m) => ({ ...m, credit: v }))} />
                </>
              )}
            </div>

            <div className="mt-5 grid gap-4 border-t border-stone-200 pt-5 sm:grid-cols-2">
              <div>
                <label htmlFor="amount-mode" className="label">{t("tools.sheet.amountMode")}</label>
                <select id="amount-mode" className="input" value={amountMode} onChange={(e) => setAmountMode(e.target.value as AmountMode)}>
                  <option value="single">{t("tools.sheet.modeSingle")}</option>
                  <option value="split">{t("tools.sheet.modeSplit")}</option>
                </select>
              </div>
              <div>
                <label htmlFor="number-format" className="label">{t("tools.sheet.numberFormat")}</label>
                <select id="number-format" className="input" value={numberFormat} onChange={(e) => setNumberFormat(e.target.value as NumberFormat)}>
                  <option value="auto">{built ? t("tools.sheet.formatDetected", { sample: built.format === "br" ? "1.234,56" : "1,234.56" }) : t("tools.sheet.formatAuto")}</option>
                  <option value="br">{t("tools.sheet.formatBr")}</option>
                  <option value="us">{t("tools.sheet.formatUs")}</option>
                </select>
              </div>
              <label className="flex items-center gap-2 text-sm text-stone-700 sm:col-span-2">
                <input type="checkbox" className="h-4 w-4 accent-teal-700" checked={invertSign} onChange={(e) => setInvertSign(e.target.checked)} />
                {t("tools.sheet.invertSign")}
              </label>
            </div>

            {hasDuplicates && <Alert variant="warning" className="mt-5">{t("msg.sheetOfx.duplicateColumns")}</Alert>}
          </section>

          <section className="card p-6" aria-labelledby="acc-title">
            <h2 id="acc-title" className="section-title mb-1">{t("tools.sheet.step2")}</h2>
            <p className="mb-5 text-sm text-stone-600">{t("tools.sheet.step2Hint")}</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="bank-id" className="label">{t("tools.sheet.bankId")}</label>
                <input id="bank-id" className="input" value={bankId} maxLength={22} placeholder={t("tools.sheet.bankPh")} onChange={(e) => setBankId(e.target.value.trim())} />
              </div>
              <div>
                <label htmlFor="account-id" className="label">{t("tools.sheet.accountId")}</label>
                <input id="account-id" className="input" value={accountId} maxLength={22} placeholder={t("tools.sheet.accountPh")} onChange={(e) => setAccountId(e.target.value.trim())} />
              </div>
            </div>
            {!accountOk && <Alert variant="warning" className="mt-4">{t("msg.sheetOfx.invalidAccount")}</Alert>}
          </section>

          <section className="card p-6" aria-labelledby="check-title">
            <h2 id="check-title" className="section-title mb-1">{t("tools.sheet.step3")}</h2>
            {unrecognized && (
              <Alert variant="warning" title={t("tools.sheet.unrecognizedTitle")} className="mt-4">
                {t("tools.sheet.unrecognized")}
              </Alert>
            )}
            {missing.length > 0 && (
              <Alert variant="warning" className="mt-4">
                {t("tools.sheet.missingLead", { items: missing.join(t("tools.sheet.and")) })}{" "}
                <a href="#map-title" className="font-medium underline">{t("tools.sheet.goMapping")}</a>
              </Alert>
            )}
            {hasDuplicates && missing.length === 0 && (
              <Alert variant="warning" className="mt-4">{t("msg.sheetOfx.duplicateColumns")}</Alert>
            )}

            {ready && built && (
              <>
                {summary ? (
                  <dl className="mb-5 mt-4 grid gap-4 sm:grid-cols-4" data-testid="sheet-summary">
                    {[
                      [t("tools.sheet.sumCount"), number(summary.count)],
                      [t("tools.sheet.sumPeriod"), t("tools.sheet.periodRange", { from: showDate(summary.from), to: showDate(summary.to) })],
                      [t("tools.sheet.sumIn"), brl.format(summary.inflow)],
                      [t("tools.sheet.sumOut"), brl.format(summary.outflow)],
                    ].map(([k, v]) => (
                      <div key={k}>
                        <dt className="text-xs text-stone-500">{k}</dt>
                        <dd className="text-sm font-semibold text-stone-900">{v}</dd>
                      </div>
                    ))}
                  </dl>
                ) : (
                  <Alert variant="warning" className="mt-4">
                    {t("tools.sheet.noValid", { reasons: skipReasons ? ` (${skipReasons})` : "" })}
                  </Alert>
                )}

                {built.transactions.length > 0 && (
                  <div className="mb-5 overflow-x-auto rounded-md border border-stone-200">
                    <table className="w-full min-w-[32rem] text-sm">
                      <thead className="border-b border-stone-200 bg-stone-50">
                        <tr>
                          <th className="table-th">{t("tools.sheet.colDate")}</th>
                          <th className="table-th">{t("tools.sheet.colDescription")}</th>
                          <th className="table-th text-right">{t("tools.sheet.colAmount")}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-100">
                        {built.transactions.slice(0, 5).map((tx, i) => (
                          <tr key={i}>
                            <td className="table-td font-mono text-xs">{showDate(tx.date)}</td>
                            <td className="table-td max-w-[20rem] truncate">{tx.description}</td>
                            <td className={`table-td text-right font-mono text-xs ${tx.amount < 0 ? "text-red-700" : "text-teal-800"}`}>{brl.format(tx.amount)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {built.transactions.length > 5 && <p className="border-t border-stone-200 px-4 py-2 text-xs text-stone-500">{t("tools.sheet.showing", { total: number(built.transactions.length) })}</p>}
                  </div>
                )}

                {built.skipped.length > 0 && (
                  <Alert variant="warning" title={tn("tools.sheet.skippedTitle", built.skipped.length)} className="mb-5">
                    <span data-testid="sheet-skipped">
                      {built.skipped.slice(0, 5).map((r) => t("tools.sheet.skippedRow", { row: r.row, reason: reasonText(r.reason), sample: r.sample ? `: “${r.sample}”` : "" })).join("; ")}
                      {built.skipped.length > 5 ? "…" : "."}{t("tools.sheet.skippedTail")}
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
              {t("tools.sheet.generate")}
            </button>
          </section>
        </>
      )}
    </div>
  );
}
