import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/site";
import { LOCALES } from "@/i18n/config";

// Áreas privadas por idioma (/en/dashboard, /es/admin...) e a API.
const PRIVATE = ["dashboard/", "admin/", "checkout", "upgrade"];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/api/", ...LOCALES.flatMap((l) => PRIVATE.map((p) => `/${l}/${p}`))] }],
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
