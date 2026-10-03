"use client";

import { useEffect } from "react";
import type { ImageInfo } from "@/utils/fileInspector/media";
import { formatNumber } from "@/utils/fileInspector/format";
import { useI18n } from "@/i18n/I18nProvider";
import MetaTable from "./MetaTable";

export default function ImageViewer({ info, size }: { info: ImageInfo; size: string }) {
  const { t } = useI18n();
  useEffect(() => () => URL.revokeObjectURL(info.previewUrl), [info.previewUrl]);

  return (
    <div className="grid md:grid-cols-[1fr_minmax(0,1.2fr)]">
      <div className="md:border-r md:border-stone-200">
        <MetaTable
          rows={[
            [t("tools.inspector.image.size"), size],
            [t("tools.inspector.image.resolution"), `${formatNumber(info.width)} × ${formatNumber(info.height)} px`],
            [t("tools.inspector.image.megapixels"), `${info.megapixels.toFixed(2)} MP`],
            [t("tools.inspector.image.ratio"), info.aspectRatio],
            [t("tools.inspector.image.mime"), info.mime],
          ]}
        />
      </div>
      <div
        className="flex min-h-[16rem] items-center justify-center p-4"
        style={{ backgroundColor: "#f5f5f4", backgroundImage: "linear-gradient(45deg,#e7e5e4 25%,transparent 25%,transparent 75%,#e7e5e4 75%),linear-gradient(45deg,#e7e5e4 25%,transparent 25%,transparent 75%,#e7e5e4 75%)", backgroundSize: "16px 16px", backgroundPosition: "0 0,8px 8px" }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={info.previewUrl} alt={t("tools.inspector.image.alt")} data-testid="image-preview" className="max-h-[26rem] max-w-full rounded-md border border-stone-200 object-contain" />
      </div>
    </div>
  );
}
