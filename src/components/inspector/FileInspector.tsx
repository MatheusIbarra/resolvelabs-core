"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ACCEPT, SUPPORTED_LABEL, detectKind } from "@/utils/fileInspector/detect";
import { formatBytes, formatNumber } from "@/utils/fileInspector/format";
import { decodeOfxBytes, parseOfx } from "@/utils/fileInspector/ofx";
import { createSpreadsheetEngine, type SpreadsheetEngine } from "@/utils/fileInspector/spreadsheet";
import { decodeText } from "@/utils/fileInspector/text";
import { formatXml, jsonNode, parseJson, parseXml, xmlNode, type TreeNode } from "@/utils/fileInspector/tree";
import { PdfPasswordError, inspectImage, inspectPdf, type ImageInfo, type PdfInfo } from "@/utils/fileInspector/media";
import type { FileKind, OfxData } from "@/utils/fileInspector/types";
import { Loading } from "../ui/Loading";
import Alert from "../ui/Alert";
import { useToast } from "../ui/Toast";
import ImageViewer from "./ImageViewer";
import OfxViewer from "./OfxViewer";
import PdfViewer from "./PdfViewer";
import SpreadsheetViewer from "./SpreadsheetViewer";
import TreeViewer from "./TreeViewer";
import { BAR, BTN, DIM } from "./ui";

const MAX_FILE_BYTES = 200 * 1024 * 1024;
const MAX_TEXT_BYTES = 60 * 1024 * 1024; // JSON/XML/OFX são carregados inteiros na memória

const KIND_LABEL: Record<FileKind, string> = {
  spreadsheet: "Planilha", ofx: "OFX", xml: "XML", json: "JSON", pdf: "PDF", image: "Imagem",
};

type Loaded =
  | { kind: "spreadsheet"; engine: SpreadsheetEngine }
  | { kind: "ofx"; data: OfxData }
  | { kind: "json" | "xml"; root: TreeNode; getText: () => string }
  | { kind: "pdf"; info: PdfInfo }
  | { kind: "image"; info: ImageInfo };

interface Result {
  file: { name: string; size: number; lastModified: number };
  readMs: number;
  loaded: Loaded;
}

/** Libera recursos (worker, PDF, URL de imagem) do resultado anterior. */
function disposeResult(result: Result | null) {
  if (!result) return;
  const { loaded } = result;
  if (loaded.kind === "spreadsheet") loaded.engine.dispose();
  else if (loaded.kind === "pdf") loaded.info.dispose();
  else if (loaded.kind === "image") URL.revokeObjectURL(loaded.info.previewUrl);
}

async function inspect(file: File, kind: FileKind): Promise<Loaded> {
  if (kind === "spreadsheet") return { kind, engine: await createSpreadsheetEngine(file) };
  if (kind === "pdf") return { kind, info: await inspectPdf(file) };
  if (kind === "image") return { kind, info: await inspectImage(file) };

  if (file.size > MAX_TEXT_BYTES) {
    throw new Error(`Arquivo ${KIND_LABEL[kind]} muito grande para pré-visualizar (${formatBytes(file.size)}; limite ${formatBytes(MAX_TEXT_BYTES)}).`);
  }
  const buffer = await file.arrayBuffer();
  if (kind === "ofx") return { kind, data: parseOfx(decodeOfxBytes(buffer)) };
  if (kind === "json") {
    const value = parseJson(decodeText(buffer));
    return { kind, root: jsonNode(value, "$"), getText: () => JSON.stringify(value, null, 2) };
  }
  const parsed = parseXml(decodeText(buffer));
  return { kind: "xml", root: xmlNode(parsed.root, "/"), getText: () => formatXml(parsed.doc) };
}

export default function FileInspector() {
  const toast = useToast();
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isReading, setIsReading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultRef = useRef<Result | null>(null);
  const runId = useRef(0);

  useEffect(() => () => disposeResult(resultRef.current), []);

  const copy = useCallback(
    async (text: string, label: string) => {
      try {
        await navigator.clipboard.writeText(text);
        toast.success(label);
      } catch {
        toast.error("Não foi possível copiar para a área de transferência.");
      }
    },
    [toast],
  );

  const open = useCallback(async (file: File | undefined) => {
    if (!file) return;
    const id = ++runId.current; // descarta resultado de leituras antigas (usuário trocou de arquivo)
    setIsReading(true);
    setError(null);
    const started = performance.now();
    try {
      if (file.size > MAX_FILE_BYTES) throw new Error(`Arquivo grande demais (${formatBytes(file.size)}). O limite é ${formatBytes(MAX_FILE_BYTES)}.`);
      const kind = await detectKind(file);
      if (!kind) throw new Error(`Tipo de arquivo não suportado: "${file.name}". Aceitamos ${SUPPORTED_LABEL}.`);
      const loaded = await inspect(file, kind);
      if (id !== runId.current) {
        disposeResult({ file, readMs: 0, loaded });
        return;
      }
      disposeResult(resultRef.current);
      const next: Result = { file: { name: file.name, size: file.size, lastModified: file.lastModified }, readMs: Math.round(performance.now() - started), loaded };
      resultRef.current = next;
      setResult(next);
    } catch (err) {
      if (id !== runId.current) return;
      const message = err instanceof PdfPasswordError ? err.message : err instanceof Error ? err.message : "Não foi possível ler o arquivo.";
      setError(message);
      toast.error(message);
    } finally {
      if (id === runId.current) setIsReading(false);
    }
  }, [toast]);

  const clear = () => {
    runId.current++;
    disposeResult(resultRef.current);
    resultRef.current = null;
    setResult(null);
    setError(null);
  };

  const loaded = result?.loaded;
  const sizeLabel = result ? formatBytes(result.file.size) : "";

  return (
    <div
      className="card overflow-hidden"
      onDragOver={(e) => {
        e.preventDefault();
        if (!isDragging) setIsDragging(true);
      }}
      onDragLeave={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setIsDragging(false);
      }}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragging(false);
        void open(e.dataTransfer.files?.[0]);
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        className="hidden"
        data-testid="inspector-input"
        onChange={(e) => {
          void open(e.target.files?.[0]);
          e.target.value = "";
        }}
      />

      {/* Barra de status */}
      <div className={`${BAR} bg-stone-50`}>
        {result ? (
          <>
            <span className="min-w-0 truncate font-medium text-stone-900" title={result.file.name} data-testid="file-name">{result.file.name}</span>
            <span className="badge-brand" data-testid="file-kind">{KIND_LABEL[result.loaded.kind]}</span>
            <span className={DIM}>{sizeLabel}</span>
            <span className={`${DIM} text-xs`}>lido em {formatNumber(result.readMs)} ms</span>
            <span className={`${DIM} hidden text-xs sm:inline`}>modificado em {new Date(result.file.lastModified).toLocaleString("pt-BR")}</span>
          </>
        ) : (
          <span className="font-medium text-stone-700">Inspetor de arquivos</span>
        )}
        <span className="ml-auto flex gap-2">
          {result && <button className={BTN} onClick={clear}>Limpar</button>}
          <button className={result ? BTN : "btn-primary !px-3 !py-1.5"} onClick={() => inputRef.current?.click()} disabled={isReading}>
            {result ? "Trocar arquivo" : "Escolher arquivo"}
          </button>
        </span>
      </div>

      {isReading && (
        <div className="border-b border-stone-200 px-4 py-3">
          <Loading>Lendo o arquivo…</Loading>
        </div>
      )}

      {error && !isReading && (
        <div className="border-b border-stone-200 p-3" data-testid="inspector-error">
          <Alert variant="error">{error}</Alert>
        </div>
      )}

      {!result ? (
        <div className="p-5">
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
            className={`group flex min-h-[18rem] cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed px-6 py-12 text-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-700/40 ${
              isDragging ? "border-teal-600 bg-teal-50" : "border-stone-300 bg-stone-50 hover:border-teal-600 hover:bg-teal-50/50"
            }`}
          >
            <svg className="mb-4 h-10 w-10 text-stone-400 group-hover:text-teal-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <p className="mb-1 text-lg font-semibold text-stone-900">{isDragging ? "Solte o arquivo para inspecionar" : "Arraste um arquivo aqui"}</p>
            <p className="mb-5 text-sm text-stone-600">ou clique para escolher no computador</p>
            <p className="mb-2 text-xs text-stone-500">{SUPPORTED_LABEL}</p>
            <p className="text-xs font-medium text-teal-800">100% local: o arquivo nunca sai do seu navegador.</p>
          </div>
        </div>
      ) : (
        <div className={isDragging ? "outline outline-2 -outline-offset-2 outline-teal-600" : undefined}>
          {loaded?.kind === "spreadsheet" && <SpreadsheetViewer engine={loaded.engine} onCopy={copy} />}
          {loaded?.kind === "ofx" && <OfxViewer data={loaded.data} />}
          {(loaded?.kind === "json" || loaded?.kind === "xml") && <TreeViewer root={loaded.root} getText={loaded.getText} onCopy={copy} />}
          {loaded?.kind === "pdf" && <PdfViewer info={loaded.info} size={sizeLabel} />}
          {loaded?.kind === "image" && <ImageViewer info={loaded.info} size={sizeLabel} />}
        </div>
      )}
    </div>
  );
}
