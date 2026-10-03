"use client";

import { useEffect, useRef, useState } from "react";
import type { PdfInfo } from "@/utils/fileInspector/media";
import { formatNumber } from "@/utils/fileInspector/format";
import { useI18n } from "@/i18n/I18nProvider";
import MetaTable from "./MetaTable";
import { DIM } from "./ui";

const INFO_KEYS = ["Title", "Author", "Subject", "Keywords", "Creator", "Producer", "CreationDate", "ModDate"] as const;

const mm = (pt: number) => Math.round((pt * 25.4) / 72);
function paperName(w: number, h: number): "A4" | "letter" | "A5" | "A3" | "custom" {
  const [a, b] = [Math.round(Math.min(w, h)), Math.round(Math.max(w, h))];
  const near = (x: number, y: number) => Math.abs(a - x) <= 3 && Math.abs(b - y) <= 3;
  if (near(595, 842)) return "A4";
  if (near(612, 792)) return "letter";
  if (near(420, 595)) return "A5";
  if (near(842, 1191)) return "A3";
  return "custom";
}

export default function PdfViewer({ info, size }: { info: PdfInfo; size: string }) {
  const { t } = useI18n();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const { widthPt, heightPt } = info.pageSize;
  const paper = paperName(widthPt, heightPt);

  useEffect(() => {
    if (!canvasRef.current) return;
    info.renderFirstPage(canvasRef.current, 520).catch(() => setPreviewError(t("tools.inspector.previewFailed")));
  }, [info, t]);

  return (
    <div className="grid md:grid-cols-[1fr_auto]">
      <div className="md:border-r md:border-stone-200">
        <MetaTable
          rows={[
            [t("tools.inspector.pdf.size"), size],
            [t("tools.inspector.pdf.pages"), formatNumber(info.pages)],
            [t("tools.inspector.pdf.pageSize"), `${widthPt.toFixed(0)} × ${heightPt.toFixed(0)} pt  (${mm(widthPt)} × ${mm(heightPt)} mm · ${paper === "letter" ? t("tools.inspector.pdf.letter") : paper === "custom" ? t("tools.inspector.pdf.custom") : paper})`],
            [t("tools.inspector.pdf.orientation"), widthPt > heightPt ? t("tools.inspector.pdf.landscape") : t("tools.inspector.pdf.portrait")],
            [t("tools.inspector.pdf.version"), info.version],
            ...Object.entries(info.info).map(([k, v]) => [(INFO_KEYS as readonly string[]).includes(k) ? t(`tools.inspector.pdf.info.${k as (typeof INFO_KEYS)[number]}`) : k, v] as [string, string]),
            [t("tools.inspector.pdf.features"), [info.flags.linearized && t("tools.inspector.pdf.linearized"), info.flags.form && t("tools.inspector.pdf.form"), info.flags.xfa && "XFA"].filter(Boolean).join(", ") || undefined],
          ]}
        />
      </div>
      <div className="flex min-h-[16rem] items-start justify-center bg-stone-100 p-5">
        {previewError ? <p className={DIM}>{previewError}</p> : <canvas ref={canvasRef} data-testid="pdf-preview" className="max-w-full rounded-md border border-stone-200 bg-white" />}
      </div>
    </div>
  );
}
