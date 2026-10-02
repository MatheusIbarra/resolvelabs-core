import ToolLayout from "@/components/tools/ToolLayout";
import ToolGuard from "@/components/tools/ToolGuard";
import ImageBatchProcessor from "@/components/tools/ImageBatchProcessor";

export const metadata = { title: "Processador de Imagens em Lote - ResolveLabs" };

export default function Page() {
  return (
    <ToolLayout
      wide
      breadcrumbs={["Home", "Todas as Ferramentas", "Processador de Imagens em Lote"]}
      title="Otimizador e Marca D'água em Lote"
      description="Redimensione, comprima para WebP e aplique sua logo em até 100 imagens simultaneamente. Tudo no seu navegador, sem lentidão."
    >
      <ToolGuard slug="processador-imagens">
        <ImageBatchProcessor />
      </ToolGuard>
    </ToolLayout>
  );
}
