"use client";

import { useEffect, useRef, useState } from "react";
import { DEFAULT_OPTIONS, loadWatermarkLogo, processImagesToZip } from "@/utils/imageProcessor";
import { downloadBlob } from "@/utils/download";
import { IMAGE_MOCK_THUMBS } from "@/lib/content";
import UsageBadge from "./UsageBadge";
import { useToast } from "../ui/Toast";
import { LoadingLabel } from "../ui/Loading";
import { MSG, errorMessage } from "@/lib/messages";

const MAX_IMAGES = 100;
const FREE_BATCH = 10;

interface Preview {
  id: string;
  name: string;
  url: string;
}

export default function ImageBatchProcessor() {
  const toast = useToast();
  const [previews, setPreviews] = useState<Preview[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [resizeEnabled, setResizeEnabled] = useState(true);
  const [maxWidth, setMaxWidth] = useState(1920);
  const [format, setFormat] = useState<"WebP" | "JPEG">("WebP");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [quality, setQuality] = useState(80);
  const [watermarkText, setWatermarkText] = useState(DEFAULT_OPTIONS.watermarkText ?? "");
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [lastReduction, setLastReduction] = useState<number | null>(null);
  const [opacity, setOpacity] = useState(50);
  const [isProcessing, setIsProcessing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const logoRef = useRef<HTMLInputElement>(null);
  const previewsRef = useRef<Preview[]>([]);

  previewsRef.current = previews;
  useEffect(() => () => previewsRef.current.forEach((p) => URL.revokeObjectURL(p.url)), []);

  const addFiles = (list: FileList | null) => {
    if (!list) return;
    const images = Array.from(list).filter((f) => f.type.startsWith("image/"));
    const room = MAX_IMAGES - previews.length;
    if (images.length > room) toast.warning(MSG.images.batchLimit(MAX_IMAGES));
    else if (images.length < list.length) toast.warning(MSG.images.onlyImages);

    const accepted = images.slice(0, Math.max(room, 0));
    setFiles((prev) => [...prev, ...accepted]);
    const added = accepted.map((f, i) => ({
      id: `${Date.now()}-${i}-${f.name}`,
      name: f.name,
      url: URL.createObjectURL(f),
    }));
    setPreviews((prev) => [...prev, ...added]);
    setLastReduction(null);
  };

  const clear = () => {
    previews.forEach((p) => URL.revokeObjectURL(p.url));
    setPreviews([]);
    setFiles([]);
    setLastReduction(null);
  };

  const process = async () => {
    if (files.length === 0 || isProcessing) return;
    if (files.length > FREE_BATCH) {
      toast.warning(MSG.images.freeBatchLimit(FREE_BATCH, MAX_IMAGES));
      return;
    }
    setIsProcessing(true);
    setProgress({ done: 0, total: previews.length });
    try {
      const logo = logoFile ? await loadWatermarkLogo(logoFile) : null;
      const result = await processImagesToZip(
        files,
        {
          maxWidth: resizeEnabled ? maxWidth : null,
          quality: quality / 100,
          mimeType: format === "WebP" ? "image/webp" : "image/jpeg",
          watermarkText,
          watermarkLogo: logo,
          watermarkOpacity: opacity / 100,
        },
        (done, total) => setProgress({ done, total }),
      );
      downloadBlob(result.zip, "imagens-processadas.zip");
      setLastReduction(result.reductionPercent);
      toast.success(MSG.images.processed(result.images.length, result.reductionPercent), { title: MSG.images.processedTitle });
    } catch (err) {
      toast.error(errorMessage(err, MSG.images.failed));
    } finally {
      setIsProcessing(false);
      setProgress(null);
    }
  };

  const estimated = (resizeEnabled ? 40 : 15) + (format === "WebP" ? 20 : 0);

  return (
    <>
      {/* Etapa 1: Dropzone */}
      <section className="card mb-6">
        <div className="flex items-center justify-between border-b border-stone-200 px-5 py-4">
          <h2 className="section-title">1. Suas imagens</h2>
          <div className="flex items-center gap-3">
            <span className="badge-neutral">{previews.length}/{MAX_IMAGES}</span>
            {previews.length > 0 && (
              <button onClick={clear} className="text-sm text-stone-500 hover:text-red-700 hover:underline">Limpar</button>
            )}
          </div>
        </div>

        <div className="p-5">
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => {
              addFiles(e.target.files);
              e.target.value = "";
            }}
          />
          <div
            onClick={() => inputRef.current?.click()}
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
              addFiles(e.dataTransfer.files);
            }}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                inputRef.current?.click();
              }
            }}
            className={`mb-5 cursor-pointer rounded-lg border-2 border-dashed px-6 py-10 text-center transition-colors ${
              isDragging ? "border-teal-600 bg-teal-50" : "border-stone-300 bg-stone-50 hover:border-teal-600"
            }`}
          >
            <p className="mb-1 text-lg font-semibold text-stone-900">Arraste até 100 imagens aqui</p>
            <p className="text-sm text-stone-600">ou clique para buscar no computador</p>
          </div>

          <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
            {previews.length > 0
              ? previews.slice(0, 12).map((p) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={p.id} src={p.url} alt={p.name} className="aspect-square w-full rounded-md border border-stone-200 object-cover" />
                ))
              : IMAGE_MOCK_THUMBS.map((t) => (
                  <div key={t.name} className={`flex aspect-square items-end rounded-md bg-gradient-to-br ${t.gradient} p-1.5`}>
                    <span className="truncate text-[11px] font-medium text-stone-700">{t.name}</span>
                  </div>
                ))}
          </div>
          {previews.length > 12 && <p className="mt-3 text-sm text-stone-500">+ {previews.length - 12} imagens</p>}
        </div>
      </section>

      {/* Etapa 2: Configurações */}
      <section className="card grid divide-y divide-stone-200 md:grid-cols-3 md:divide-x md:divide-y-0">
        <div className="p-6">
          <h2 className="section-title mb-5">2. Redimensionar</h2>
          <label className="mb-5 flex items-center justify-between text-sm font-medium text-stone-700">
            Redimensionar imagens
            <button
              type="button"
              role="switch"
              aria-checked={resizeEnabled}
              onClick={() => setResizeEnabled((v) => !v)}
              className={`relative h-6 w-11 rounded-full transition-colors ${resizeEnabled ? "bg-teal-700" : "bg-stone-300"}`}
            >
              <span className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${resizeEnabled ? "translate-x-5" : ""}`} />
            </button>
          </label>
          <label htmlFor="max-width" className="label">Largura máxima (px)</label>
          <input
            id="max-width"
            type="number"
            min={100}
            max={8000}
            value={maxWidth}
            disabled={!resizeEnabled}
            onChange={(e) => setMaxWidth(Number(e.target.value))}
            className="input mb-5"
          />
          <label htmlFor="format" className="label">Formato de saída</label>
          <select id="format" value={format} onChange={(e) => setFormat(e.target.value as "WebP" | "JPEG")} className="input">
            <option>WebP</option>
            <option>JPEG</option>
          </select>
          <label htmlFor="quality" className="label mt-5 flex justify-between">
            <span>Qualidade</span>
            <span className="text-stone-500">{quality}%</span>
          </label>
          <input
            id="quality"
            type="range"
            min={40}
            max={100}
            value={quality}
            onChange={(e) => setQuality(Number(e.target.value))}
            className="w-full accent-teal-700"
          />
        </div>

        <div className="p-6">
          <h2 className="section-title mb-5">3. Marca d&apos;água</h2>
          <input
            ref={logoRef}
            type="file"
            accept="image/png"
            className="hidden"
            onChange={(e) => {
              setLogoFile(e.target.files?.[0] ?? null);
              e.target.value = "";
            }}
          />
          <label htmlFor="wm-text" className="label">Texto da marca d&apos;água</label>
          <input
            id="wm-text"
            value={watermarkText}
            onChange={(e) => setWatermarkText(e.target.value)}
            maxLength={40}
            placeholder="Deixe vazio para não aplicar texto"
            className="input mb-4"
          />
          <button type="button" onClick={() => logoRef.current?.click()} className="btn-secondary w-full truncate">
            {logoFile?.name ?? "Upload da logo (PNG)"}
          </button>
          <label htmlFor="opacity" className="label mt-6 flex justify-between">
            <span>Opacidade</span>
            <span className="text-stone-500">{opacity}%</span>
          </label>
          <input
            id="opacity"
            type="range"
            min={0}
            max={100}
            value={opacity}
            onChange={(e) => setOpacity(Number(e.target.value))}
            className="w-full accent-teal-700"
          />
        </div>

        <div className="flex flex-col p-6">
          <h2 className="section-title mb-5">4. Exportar</h2>
          <p className="text-sm text-stone-500">{lastReduction !== null ? "Redução real no último lote" : "Tamanho estimado"}</p>
          <p className="mb-5 text-4xl font-semibold tracking-tight text-stone-900">
            {(lastReduction ?? estimated) >= 0 ? "-" : "+"}{Math.abs(lastReduction ?? estimated)}%
          </p>
          <button onClick={process} disabled={files.length === 0 || isProcessing} className="btn-primary mt-auto w-full py-3">
            {isProcessing ? <LoadingLabel>Processando imagens…{progress ? ` ${progress.done}/${progress.total}` : ""}</LoadingLabel> : "Processar e baixar .ZIP"}
          </button>
        </div>
      </section>

      <UsageBadge>Uso gratuito: lote de {FREE_BATCH} fotos</UsageBadge>
    </>
  );
}
