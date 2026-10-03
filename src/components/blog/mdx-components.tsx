import type { ComponentProps } from "react";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/config";
import ToolCta from "./ToolCta";

/** Componentes disponíveis dentro dos .mdx (ligados ao idioma do artigo). Mini-ferramentas futuras entram aqui. */
export function createMdxComponents(locale: Locale) {
  return {
    ToolCta: (props: { slug: string; children?: React.ReactNode }) => <ToolCta locale={locale} {...props} />,
    a: ({ href = "", ...props }: ComponentProps<"a">) =>
      href.startsWith("/") ? <Link href={href} {...props} /> : <a href={href} rel="noopener noreferrer" {...props} />,
  };
}
