"use client";

import { useCallback, useState } from "react";
import type { DenyReason } from "@/lib/content";
import Header from "./Header";
import Breadcrumbs from "./Breadcrumbs";
import ConverterHero from "./ConverterHero";
import UploadZone from "./UploadZone";
import PaywallModal from "./PaywallModal";

export default function ConverterPage() {
  const [paywallReason, setPaywallReason] = useState<DenyReason | null>(null);
  const closeModal = useCallback(() => setPaywallReason(null), []);

  return (
    <>
      <Header />
      <Breadcrumbs items={["Home", "Todas as Ferramentas", "Conversor PDF para OFX"]} />
      <main className="page-container max-w-4xl flex-1 pb-16">
        <ConverterHero />
        <UploadZone onAccessDenied={setPaywallReason} />
      </main>
      <PaywallModal isOpen={paywallReason !== null} reason={paywallReason ?? "LIMIT_REACHED"} onClose={closeModal} />
    </>
  );
}
