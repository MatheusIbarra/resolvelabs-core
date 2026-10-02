import type { Metadata } from "next";
import ToolPage from "@/components/seo/ToolPage";
import QrGenerator from "@/components/tools/QrGenerator";
import { getSeoTool } from "@/lib/seo-tools";
import { buildSeoMetadata } from "@/lib/seo-schema";

const SLUG = "gerador-qrcode";

export const metadata: Metadata = buildSeoMetadata(getSeoTool(SLUG)!);

export default function Page() {
  return (
    <ToolPage slug={SLUG} wide>
      <QrGenerator />
    </ToolPage>
  );
}
