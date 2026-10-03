"use client";

import { useRef, useState } from "react";
import { fixMerchantXml, xmlToBlob, type XmlFixResult } from "@/utils/xmlFixer";
import { downloadBlob } from "@/utils/download";
import { errorMessage } from "@/lib/messages";
import { useI18n } from "@/i18n/I18nProvider";
import { Loading, LoadingLabel } from "../ui/Loading";
import { useToast } from "../ui/Toast";
import UsageBadge from "./UsageBadge";

const FREE_ANALYSES = 1;
const MAX_ROWS = 12;

const SEVERITY = {
  error: { key: "severityError", cls: "badge-warn" },
  warning: { key: "severityWarning", cls: "badge-neutral" },
  fixed: { key: "severityFixed", cls: "badge-brand" },
} as const;

export default function XmlFixer() {
  const { t } = useI18n();
  const toast = useToast();
  const [feedUrl, setFeedUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<XmlFixResult | null>(null);
  const [sourceName, setSourceName] = useState("feed");
  const [analysesUsed, setAnalysesUsed] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const hasSource = feedUrl.trim() !== "" || file !== null;

  const acceptFile = (f: File | undefined) => {
    if (!f) return;
    if (!/\.xml$/i.test(f.name)) {
      toast.error(t("msg.xml.invalidFile"));
      return;
    }
    setFile(f);
    setResult(null);
  };

  const readSource = async (): Promise<{ text: string; name: string }> => {
    if (file) return { text: await file.text(), name: file.name.replace(/\.xml$/i, "") };
    try {
      const res = await fetch(feedUrl.trim());
      if (!res.ok) throw new Error(String(res.status));
      return { text: await res.text(), name: "feed" };
    } catch {
      throw new Error(t("msg.xml.fetchFailed")); // normalmente bloqueio de CORS
    }
  };

  const analyze = async () => {
    if (isAnalyzing) return;
    if (!hasSource) {
      toast.error(t("msg.xml.needSource"));
      return;
    }
    if (analysesUsed >= FREE_ANALYSES) {
      toast.warning(t("msg.xml.limitReached"));
      return;
    }
    setIsAnalyzing(true);
    setResult(null);
    try {
      const { text, name } = await readSource();
      const fixed = fixMerchantXml(text);
      setSourceName(name);
      setResult(fixed);
      setAnalysesUsed((n) => n + 1);
      toast.success(t("msg.xml.analyzed", { items: fixed.stats.items, errors: fixed.stats.errors, fixed: fixed.stats.fixed }), { title: t("msg.xml.analyzedTitle") });
    } catch (err) {
      toast.error(errorMessage(err, t("msg.xml.analyzeFailed")));
    } finally {
      setIsAnalyzing(false);
    }
  };

  const download = () => {
    if (!result) return;
    if (result.wellFormed === false) {
      toast.error(t("msg.xml.notWellFormed"));
      return;
    }
    downloadBlob(xmlToBlob(result.xml), `${sourceName}-${t("tools.xml.suffix")}.xml`);
    toast.success(t("msg.xml.downloaded"), { title: t("msg.xml.downloadedTitle") });
  };

  const visible = result?.issues.slice(0, MAX_ROWS) ?? [];
  const hidden = (result?.issues.length ?? 0) - visible.length;

  return (
    <>
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Entrada */}
        <section className="card p-6">
          <h2 className="section-title mb-5">{t("tools.xml.step1")}</h2>

          <p className="label">{t("tools.xml.uploadLabel")}</p>
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
            onDragLeave={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setIsDragging(false);
            }}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              acceptFile(e.dataTransfer.files?.[0]);
            }}
            className={`cursor-pointer rounded-lg border-2 border-dashed p-8 text-center text-sm transition-colors ${
              isDragging ? "border-teal-600 bg-teal-50" : "border-stone-300 bg-stone-50 hover:border-teal-600"
            }`}
          >
            <input
              ref={inputRef}
              type="file"
              accept=".xml,text/xml,application/xml"
              className="hidden"
              onClick={(e) => e.stopPropagation()}
              onChange={(e) => {
                acceptFile(e.target.files?.[0]);
                e.target.value = "";
              }}
            />
            {file ? (
              <span className="font-medium text-teal-800">{file.name}</span>
            ) : (
              <>
                <span className="font-medium text-stone-800">{t("tools.xml.dragXml")}</span>
                <span className="text-stone-500">{t("tools.xml.orClick")}</span>
              </>
            )}
          </div>

          <div className="my-5 flex items-center gap-3 text-sm text-stone-400">
            <span className="h-px flex-1 bg-stone-200" />
            {t("tools.xml.or")}
            <span className="h-px flex-1 bg-stone-200" />
          </div>

          <label htmlFor="feed-url" className="label">{t("tools.xml.urlLabel")}</label>
          <input
            id="feed-url"
            type="url"
            value={feedUrl}
            onChange={(e) => {
              setFeedUrl(e.target.value);
              setResult(null);
            }}
            disabled={file !== null}
            placeholder={t("tools.xml.urlPlaceholder")}
            className="input"
          />
          <p className="mt-2 text-xs text-stone-500">
            {t("tools.xml.hint")}
          </p>
          {file && (
            <button onClick={() => { setFile(null); setResult(null); }} className="mt-2 text-xs text-stone-500 hover:text-red-700 hover:underline">
              {t("tools.xml.removeFile")}
            </button>
          )}

          <button onClick={analyze} disabled={!hasSource || isAnalyzing} className="btn-primary mt-6 w-full py-3">
            {isAnalyzing ? <LoadingLabel>{t("tools.xml.analyzing")}</LoadingLabel> : t("tools.xml.analyze")}
          </button>
        </section>

        {/* Resultado */}
        <section className="card flex flex-col p-6">
          <h2 className="section-title mb-5">{t("tools.xml.step2")}</h2>

          {result ? (
            <>
              <div className="mb-5 flex flex-wrap gap-2">
                <span className="badge-neutral">{t("tools.xml.itemsAnalyzed", { count: result.stats.items })}</span>
                <span className="badge-brand">{t("tools.xml.fixes", { count: result.stats.fixed })}</span>
                <span className="badge-warn">{t("tools.xml.errors", { count: result.stats.errors })}</span>
                <span className="badge-neutral">{t("tools.xml.warnings", { count: result.stats.warnings })}</span>
              </div>

              {result.issues.length > 0 ? (
                <div className="mb-6 max-h-80 overflow-auto rounded-md border border-stone-200">
                  <table className="w-full text-left text-sm">
                    <thead className="sticky top-0 bg-stone-50 text-xs text-stone-500">
                      <tr>
                        <th className="px-3 py-2 font-medium">{t("tools.xml.colProduct")}</th>
                        <th className="px-3 py-2 font-medium">{t("tools.xml.colStatus")}</th>
                        <th className="px-3 py-2 font-medium">{t("tools.xml.colDetail")}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {visible.map((issue, i) => (
                        <tr key={i}>
                          <td className="whitespace-nowrap px-3 py-2 font-medium text-stone-900">
                            {issue.itemIndex >= 0 ? (issue.itemId ?? `#${issue.itemIndex + 1}`) : t("tools.xml.feedLabel")}
                          </td>
                          <td className="px-3 py-2"><span className={SEVERITY[issue.severity].cls}>{t(`tools.xml.${SEVERITY[issue.severity].key}`)}</span></td>
                          <td className="px-3 py-2 text-stone-700">{issue.message}</td>
                        </tr>
                      ))}
                      {hidden > 0 && (
                        <tr><td colSpan={3} className="px-3 py-2 text-xs text-stone-500">{t("tools.xml.more", { count: hidden })}</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="mb-6 text-sm text-teal-800">{t("tools.xml.noIssues")}</p>
              )}

              {result.stats.errors > 0 && (
                <p className="mb-4 text-xs text-stone-500">
                  {t("tools.xml.errorsNote")}
                </p>
              )}

              <button onClick={download} className="btn-primary mt-auto w-full py-3">
                {t("tools.xml.download")}
              </button>
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center rounded-md border border-dashed border-stone-300 p-8 text-center text-sm text-stone-500">
              {isAnalyzing ? <Loading>{t("tools.xml.analyzingProducts")}</Loading> : t("tools.xml.empty")}
            </div>
          )}
        </section>
      </div>

      <UsageBadge>{t("tools.xml.usage", { used: analysesUsed, limit: FREE_ANALYSES })}</UsageBadge>
    </>
  );
}
