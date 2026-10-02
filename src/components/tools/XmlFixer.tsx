"use client";

import { useRef, useState } from "react";
import { fixMerchantXml, xmlToBlob, type XmlFixResult } from "@/utils/xmlFixer";
import { downloadBlob } from "@/utils/download";
import { MSG, errorMessage } from "@/lib/messages";
import { Loading, LoadingLabel } from "../ui/Loading";
import { useToast } from "../ui/Toast";
import UsageBadge from "./UsageBadge";

const FREE_ANALYSES = 1;
const MAX_ROWS = 12;

const SEVERITY = {
  error: { label: "Erro", cls: "badge-warn" },
  warning: { label: "Aviso", cls: "badge-neutral" },
  fixed: { label: "Corrigido", cls: "badge-brand" },
} as const;

export default function XmlFixer() {
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
      toast.error(MSG.xml.invalidFile);
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
      throw new Error(MSG.xml.fetchFailed); // normalmente bloqueio de CORS
    }
  };

  const analyze = async () => {
    if (isAnalyzing) return;
    if (!hasSource) {
      toast.error(MSG.xml.needSource);
      return;
    }
    if (analysesUsed >= FREE_ANALYSES) {
      toast.warning(MSG.xml.limitReached);
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
      toast.success(MSG.xml.analyzed(fixed.stats.items, fixed.stats.errors, fixed.stats.fixed), { title: MSG.xml.analyzedTitle });
    } catch (err) {
      toast.error(errorMessage(err, MSG.xml.analyzeFailed));
    } finally {
      setIsAnalyzing(false);
    }
  };

  const download = () => {
    if (!result) return;
    if (result.wellFormed === false) {
      toast.error(MSG.xml.notWellFormed);
      return;
    }
    downloadBlob(xmlToBlob(result.xml), `${sourceName}-corrigido.xml`);
    toast.success(MSG.xml.downloaded, { title: MSG.xml.downloadedTitle });
  };

  const visible = result?.issues.slice(0, MAX_ROWS) ?? [];
  const hidden = (result?.issues.length ?? 0) - visible.length;

  return (
    <>
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Entrada */}
        <section className="card p-6">
          <h2 className="section-title mb-5">1. Seu feed</h2>

          <p className="label">Upload de arquivo XML</p>
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
                <span className="font-medium text-stone-800">Arraste um arquivo .xml</span>
                <span className="text-stone-500"> ou clique para buscar</span>
              </>
            )}
          </div>

          <div className="my-5 flex items-center gap-3 text-sm text-stone-400">
            <span className="h-px flex-1 bg-stone-200" />
            ou
            <span className="h-px flex-1 bg-stone-200" />
          </div>

          <label htmlFor="feed-url" className="label">URL do Feed XML</label>
          <input
            id="feed-url"
            type="url"
            value={feedUrl}
            onChange={(e) => {
              setFeedUrl(e.target.value);
              setResult(null);
            }}
            disabled={file !== null}
            placeholder="https://sualoja.com.br/feed-merchant.xml"
            className="input"
          />
          <p className="mt-2 text-xs text-stone-500">
            Tudo é processado no seu navegador. Se o servidor do feed bloquear a leitura direta, envie o arquivo.
          </p>
          {file && (
            <button onClick={() => { setFile(null); setResult(null); }} className="mt-2 text-xs text-stone-500 hover:text-red-700 hover:underline">
              Remover arquivo
            </button>
          )}

          <button onClick={analyze} disabled={!hasSource || isAnalyzing} className="btn-primary mt-6 w-full py-3">
            {isAnalyzing ? <LoadingLabel>Analisando feed…</LoadingLabel> : "Analisar feed"}
          </button>
        </section>

        {/* Resultado */}
        <section className="card flex flex-col p-6">
          <h2 className="section-title mb-5">2. Resultado da análise</h2>

          {result ? (
            <>
              <div className="mb-5 flex flex-wrap gap-2">
                <span className="badge-neutral">{result.stats.items} produtos analisados</span>
                <span className="badge-brand">{result.stats.fixed} correções automáticas</span>
                <span className="badge-warn">{result.stats.errors} erros</span>
                <span className="badge-neutral">{result.stats.warnings} avisos</span>
              </div>

              {result.issues.length > 0 ? (
                <div className="mb-6 max-h-80 overflow-auto rounded-md border border-stone-200">
                  <table className="w-full text-left text-sm">
                    <thead className="sticky top-0 bg-stone-50 text-xs text-stone-500">
                      <tr>
                        <th className="px-3 py-2 font-medium">Produto</th>
                        <th className="px-3 py-2 font-medium">Situação</th>
                        <th className="px-3 py-2 font-medium">Detalhe</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {visible.map((issue, i) => (
                        <tr key={i}>
                          <td className="whitespace-nowrap px-3 py-2 font-medium text-stone-900">
                            {issue.itemIndex >= 0 ? (issue.itemId ?? `#${issue.itemIndex + 1}`) : "Feed"}
                          </td>
                          <td className="px-3 py-2"><span className={SEVERITY[issue.severity].cls}>{SEVERITY[issue.severity].label}</span></td>
                          <td className="px-3 py-2 text-stone-700">{issue.message}</td>
                        </tr>
                      ))}
                      {hidden > 0 && (
                        <tr><td colSpan={3} className="px-3 py-2 text-xs text-stone-500">+ {hidden} outros itens</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="mb-6 text-sm text-teal-800">Nenhum problema encontrado no feed.</p>
              )}

              {result.stats.errors > 0 && (
                <p className="mb-4 text-xs text-stone-500">
                  Os erros não podem ser corrigidos automaticamente (ex.: preço vazio, imagem ausente). Corrija-os na sua loja.
                </p>
              )}

              <button onClick={download} className="btn-primary mt-auto w-full py-3">
                Baixar XML corrigido
              </button>
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center rounded-md border border-dashed border-stone-300 p-8 text-center text-sm text-stone-500">
              {isAnalyzing ? <Loading>Analisando os produtos…</Loading> : "Envie um arquivo ou informe a URL e clique em “Analisar feed” para ver os problemas."}
            </div>
          )}
        </section>
      </div>

      <UsageBadge>Uso gratuito: {analysesUsed}/{FREE_ANALYSES} análise</UsageBadge>
    </>
  );
}
