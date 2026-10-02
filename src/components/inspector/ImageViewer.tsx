"use client";

import { useEffect } from "react";
import type { ImageInfo } from "@/utils/fileInspector/media";
import { formatNumber } from "@/utils/fileInspector/format";
import MetaTable from "./MetaTable";

export default function ImageViewer({ info, size }: { info: ImageInfo; size: string }) {
  useEffect(() => () => URL.revokeObjectURL(info.previewUrl), [info.previewUrl]);

  return (
    <div className="grid md:grid-cols-[1fr_minmax(0,1.2fr)]">
      <div className="md:border-r md:border-stone-200">
        <MetaTable
          rows={[
            ["Tamanho do arquivo", size],
            ["Resolução", `${formatNumber(info.width)} × ${formatNumber(info.height)} px`],
            ["Megapixels", `${info.megapixels.toFixed(2)} MP`],
            ["Proporção", info.aspectRatio],
            ["Tipo (MIME)", info.mime],
          ]}
        />
      </div>
      <div
        className="flex min-h-[16rem] items-center justify-center p-4"
        style={{ backgroundColor: "#f5f5f4", backgroundImage: "linear-gradient(45deg,#e7e5e4 25%,transparent 25%,transparent 75%,#e7e5e4 75%),linear-gradient(45deg,#e7e5e4 25%,transparent 25%,transparent 75%,#e7e5e4 75%)", backgroundSize: "16px 16px", backgroundPosition: "0 0,8px 8px" }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={info.previewUrl} alt="Prévia da imagem" data-testid="image-preview" className="max-h-[26rem] max-w-full rounded-md border border-stone-200 object-contain" />
      </div>
    </div>
  );
}
