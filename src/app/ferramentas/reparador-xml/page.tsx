import { requireRolePage } from "@/lib/pageGuard";
import ToolLayout from "@/components/tools/ToolLayout";
import ToolGuard from "@/components/tools/ToolGuard";
import XmlFixer from "@/components/tools/XmlFixer";

export const metadata = { title: "Reparador de XML Merchant - ResolveLabs" };

export const dynamic = "force-dynamic";

export default async function Page() {
  await requireRolePage(["pro", "admin"], "/upgrade");
  return (
    <ToolLayout
      wide
      breadcrumbs={["Home", "Todas as Ferramentas", "Reparador de XML Merchant"]}
      title="Reparador Automático de XML para Google Merchant"
      description="Valide, limpe tags HTML quebradas e corrija erros de GTIN do seu feed de produtos em um clique para evitar bloqueios no Google Ads."
    >
      <ToolGuard slug="reparador-xml">
        <XmlFixer />
      </ToolGuard>
    </ToolLayout>
  );
}
