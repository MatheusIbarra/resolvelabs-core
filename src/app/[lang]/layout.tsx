import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { Geist, Geist_Mono } from "next/font/google";
import "../globals.css";
import { AuthProvider } from "@/hooks/useAuth";
import { ToastProvider } from "@/components/ui/Toast";
import { PaywallProvider } from "@/hooks/usePaywall";
import SupportWidget from "@/components/SupportWidget";
import RouteProgress from "@/components/ui/RouteProgress";
import PageViewLogger from "@/components/PageViewLogger";
import { I18nProvider } from "@/i18n/I18nProvider";
import { HREFLANG, LOCALES, isLocale } from "@/i18n/config";
import { clientDictionary } from "@/i18n/messages";
import { getTranslator } from "@/i18n/server";
import { buildAlternates, buildOpenGraph } from "@/i18n/seo";

const geistSans = Geist({ subsets: ["latin"], variable: "--font-geist-sans" });
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono" });

type Params = { lang: string };

export function generateStaticParams(): Params[] {
  return LOCALES.map((lang) => ({ lang }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const t = getTranslator(lang).t;
  const title = t("common.meta.title");
  const description = t("common.meta.description");
  return {
    metadataBase: new URL(process.env.APP_URL ?? "http://localhost:3000"),
    title,
    description,
    applicationName: "ResolveLabs",
    manifest: "/site.webmanifest",
    alternates: buildAlternates(lang, "/"),
    icons: {
      icon: [
        { url: "/favicon.ico", sizes: "any" },
        { url: "/icon.svg", type: "image/svg+xml" },
      ],
      apple: "/apple-touch-icon.png",
    },
    openGraph: buildOpenGraph(lang, {
      type: "website",
      title,
      description,
      images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "ResolveLabs" }],
    }),
    twitter: { card: "summary_large_image", title, description, images: ["/og-image.png"] },
  };
}

export const viewport: Viewport = { themeColor: "#0f766e" };

export default async function RootLayout({ children, params }: { children: React.ReactNode; params: Promise<Params> }) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  return (
    <html lang={HREFLANG[lang]}>
      <body
        className={`${geistSans.variable} ${geistMono.variable} font-sans bg-stone-50 text-stone-800 min-h-screen flex flex-col antialiased`}
      >
        <I18nProvider locale={lang} dictionary={clientDictionary(lang)}>
          <RouteProgress />
          <PageViewLogger />
          <ToastProvider>
            <AuthProvider>
              <PaywallProvider>
                {children}
                <SupportWidget />
              </PaywallProvider>
            </AuthProvider>
          </ToastProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
