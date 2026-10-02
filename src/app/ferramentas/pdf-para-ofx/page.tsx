import ConverterPage from "@/components/ConverterPage";

// Rota protegida (login): não indexar. A landing pública é /ferramentas/conversor-pdf-para-ofx.
export const metadata = { title: "ResolveLabs - PDF para OFX", robots: { index: false, follow: false } };

export default function Page() {
  return <ConverterPage />;
}
