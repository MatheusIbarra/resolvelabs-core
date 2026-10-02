import ToolLayout from "@/components/tools/ToolLayout";
import TrackView from "@/components/seo/TrackView";
import MockDataGenerator from "@/components/tools/MockDataGenerator";

export const metadata = {
  title: "Gerador de Mock Data BR - ResolveLabs",
  description: "Gere JSON com CPFs, CNPJs, CEPs válidos e chaves PIX para popular bancos de dados e testar pipelines. Tudo no navegador.",
  alternates: { canonical: "/ferramentas/mock-data-br" },
};

export default function Page() {
  return (
    <ToolLayout
      wide
      breadcrumbs={["Home", "Todas as Ferramentas", "Gerador de Dados BR"]}
      title="Gerador de Mock Data Brasileiro"
      description="Gere arrays JSON com CPFs, CNPJs, CEPs válidos e chaves PIX para popular bancos de dados e testar pipelines."
    >
      <TrackView tool="mock-data-br" />
      <MockDataGenerator />
    </ToolLayout>
  );
}
