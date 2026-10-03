"use client";

// Substitutos de `next/link` e `next/navigation` que entendem o idioma: passe sempre o caminho canônico
// ("/ferramentas/pdf-para-ofx") e o prefixo/tradução do segmento é aplicado aqui.
import NextLink from "next/link";
import { usePathname as useNextPathname, useRouter as useNextRouter } from "next/navigation";
import { forwardRef, useMemo } from "react";
import { useLocale } from "./I18nProvider";
import { isUnlocalizable, localizePath, parsePath, toCanonicalPath } from "./paths";
import type { Locale } from "./config";

export function localizeHref(locale: Locale, href: string): string {
  // Já com prefixo de idioma (ex.: o `next` do login, que vem da URL do navegador): não prefixa de novo.
  if (isUnlocalizable(href) || parsePath(href).locale) return href;
  return localizePath(locale, href);
}

type LinkProps = Omit<React.ComponentProps<typeof NextLink>, "href"> & { href: string };

export const Link = forwardRef<HTMLAnchorElement, LinkProps>(function Link({ href, ...props }, ref) {
  const locale = useLocale();
  return <NextLink ref={ref} href={localizeHref(locale, href)} {...props} />;
});

/** Caminho atual sem prefixo de idioma e com segmentos canônicos (ex.: "/ferramentas/pdf-para-ofx"). */
export function usePathname(): string {
  const pathname = useNextPathname();
  return useMemo(() => toCanonicalPath(pathname ?? "/"), [pathname]);
}

export function useRouter() {
  const router = useNextRouter();
  const locale = useLocale();
  return useMemo(
    () => ({
      push: (href: string) => router.push(localizeHref(locale, href)),
      replace: (href: string) => router.replace(localizeHref(locale, href)),
      refresh: () => router.refresh(),
      back: () => router.back(),
      prefetch: (href: string) => router.prefetch(localizeHref(locale, href)),
    }),
    [router, locale],
  );
}
