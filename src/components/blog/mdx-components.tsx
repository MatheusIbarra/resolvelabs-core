import Link from "next/link";
import type { ComponentProps } from "react";
import ToolCta from "./ToolCta";

/** Componentes disponíveis dentro dos .mdx. Mini-ferramentas futuras entram aqui. */
export const mdxComponents = {
  ToolCta,
  a: ({ href = "", ...props }: ComponentProps<"a">) =>
    href.startsWith("/") ? <Link href={href} {...props} /> : <a href={href} rel="noopener noreferrer" {...props} />,
};
