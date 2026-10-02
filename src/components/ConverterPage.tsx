"use client";

import Header from "./Header";
import Breadcrumbs from "./Breadcrumbs";
import ConverterHero from "./ConverterHero";
import UploadZone from "./UploadZone";

export default function ConverterPage() {
  return (
    <>
      <Header />
      <Breadcrumbs items={["Home", "Todas as Ferramentas", "Conversor PDF para OFX"]} />
      <main className="page-container max-w-4xl flex-1 pb-16">
        <ConverterHero />
        <UploadZone />
      </main>
    </>
  );
}
