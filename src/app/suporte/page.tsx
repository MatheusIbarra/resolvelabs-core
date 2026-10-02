import Header from "@/components/Header";
import Breadcrumbs from "@/components/Breadcrumbs";
import PageHeading from "@/components/PageHeading";

export const metadata = { title: "Suporte - ResolveLabs" };

export default function SupportPage() {
  return (
    <>
      <Header />
      <Breadcrumbs items={["Home", "Suporte"]} />
      <main className="page-container max-w-4xl flex-1 pb-20">
        <PageHeading title="Suporte" description="Dúvidas ou problemas com alguma ferramenta? Fale com a gente por e-mail." />
        <a href="mailto:suporte@resolvelabs.com" className="btn-primary px-5 py-3">
          suporte@resolvelabs.com
        </a>
      </main>
    </>
  );
}
