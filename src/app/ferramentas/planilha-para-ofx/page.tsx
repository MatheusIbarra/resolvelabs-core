import type { Metadata } from "next";
import ToolPage from "@/components/seo/ToolPage";
import SheetToOfxConverter from "@/components/tools/SheetToOfxConverter";
import { getSeoTool } from "@/lib/seo-tools";
import { buildSeoMetadata } from "@/lib/seo-schema";

const SLUG = "planilha-para-ofx";

export const metadata: Metadata = buildSeoMetadata(getSeoTool(SLUG)!);

export default function Page() {
  return (
    <ToolPage slug={SLUG} wide>
      <SheetToOfxConverter />
    </ToolPage>
  );
}
