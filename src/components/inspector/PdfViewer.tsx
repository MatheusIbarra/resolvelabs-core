"use client";

import { useEffect, useRef, useState } from "react";
import type { PdfInfo } from "@/utils/fileInspector/media";
import { formatNumber } from "@/utils/fileInspector/format";
import MetaTable from "./MetaTable";
import { DIM } from "./ui";

const INFO_LABELS: Record<string, string> = {
  Title: "Título", Author: "Autor", Subject: "Assunto", Keywords: "Palavras-chave",
  Creator: "Criado por", Producer: "Gerador (producer)", CreationDate: "Criado em", ModDate: "Modificado em",
};

const mm = (pt: number) => Math.round((pt * 25.4) / 72);
function paperName(w: number, h: number): string {
  const [a, b] = [Math.round(Math.min(w, h)), Math.round(Math.max(w, h))];
  const near = (x: number, y: number) => Math.abs(a - x) <= 3 && Math.abs(b - y) <= 3;
  if (near(595, 842)) return "A4";
  if (near(612, 792)) return "Carta (Letter)";
  if (near(420, 595)) return "A5";
  if (near(842, 1191)) return "A3";
  return "personalizado";
}

export default function PdfViewer({ info, size }: { info: PdfInfo; size: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const { widthPt, heightPt } = info.pageSize;

  useEffect(() => {
    if (!canvasRef.current) return;
    info.renderFirstPage(canvasRef.current, 520).catch(() => setPreviewError("Não foi possível renderizar a prévia."));
  }, [info]);

  return (
    <div className="grid md:grid-cols-[1fr_auto]">
      <div className="md:border-r md:border-stone-200">
        <MetaTable
          rows={[
            ["Tamanho do arquivo", size],
            ["Páginas", formatNumber(info.pages)],
            ["Dimensão da página", `${widthPt.toFixed(0)} × ${heightPt.toFixed(0)} pt  (${mm(widthPt)} × ${mm(heightPt)} mm · ${paperName(widthPt, heightPt)})`],
            ["Orientação", widthPt > heightPt ? "Paisagem" : "Retrato"],
            ["Versão do PDF", info.version],
            ...Object.entries(info.info).map(([k, v]) => [INFO_LABELS[k] ?? k, v] as [string, string]),
            ["Recursos", [info.flags.linearized && "linearizado", info.flags.form && "formulário (AcroForm)", info.flags.xfa && "XFA"].filter(Boolean).join(", ") || undefined],
          ]}
        />
      </div>
      <div className="flex min-h-[16rem] items-start justify-center bg-stone-100 p-5">
        {previewError ? <p className={DIM}>{previewError}</p> : <canvas ref={canvasRef} data-testid="pdf-preview" className="max-w-full rounded-md border border-stone-200 bg-white" />}
      </div>
    </div>
  );
}
