import Header from "@/components/Header";
import Breadcrumbs from "@/components/Breadcrumbs";
import PageHeading from "@/components/PageHeading";
import ToolCardGrid from "@/components/tools/ToolCardGrid";
import SeoToolLinks from "@/components/seo/SeoToolLinks";

export const metadata = { title: "Todas as Ferramentas - ResolveLabs" };

export default function ToolsIndexPage() {
  return (
    <>
      <Header />
      <Breadcrumbs items={["Home", "Todas as Ferramentas"]} />
      <main className="page-container flex-1 pb-20">
        <PageHeading
          title="Todas as ferramentas"
          description="Micro-ferramentas para contadores, lojistas, corretores e desenvolvedores. Escolha a sua e comece gratuitamente."
        />
        <ToolCardGrid />
        <SeoToolLinks />
      </main>
    </>
  );
}
