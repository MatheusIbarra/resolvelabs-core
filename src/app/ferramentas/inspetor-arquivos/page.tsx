import ToolLayout from "@/components/tools/ToolLayout";
import FileInspector from "@/components/inspector/FileInspector";

export const metadata = { title: "Inspetor Universal de Arquivos - ResolveLabs" };

export default function Page() {
  return (
    <ToolLayout
      wide
      breadcrumbs={["Home", "Ferramentas Gerais", "Inspetor Universal de Arquivos"]}
      title="Inspetor Universal de Arquivos"
      description="Abra planilhas (XLSX, XLS, CSV), extratos OFX, XML, JSON, PDF e imagens e veja o conteúdo e os metadados técnicos. Tudo é lido no seu navegador, sem enviar nada a servidor."
    >
      <FileInspector />
    </ToolLayout>
  );
}
