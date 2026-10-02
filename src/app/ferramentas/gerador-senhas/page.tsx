import type { Metadata } from "next";
import ToolPage from "@/components/seo/ToolPage";
import PasswordGenerator from "@/components/tools/PasswordGenerator";
import { getSeoTool } from "@/lib/seo-tools";
import { buildSeoMetadata } from "@/lib/seo-schema";

const SLUG = "gerador-senhas";

export const metadata: Metadata = buildSeoMetadata(getSeoTool(SLUG)!);

export default function Page() {
  return (
    <ToolPage slug={SLUG} wide>
      <PasswordGenerator />
    </ToolPage>
  );
}
