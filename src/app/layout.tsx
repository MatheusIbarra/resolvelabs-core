import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/hooks/useAuth";
import { ToastProvider } from "@/components/ui/Toast";
import { PaywallProvider } from "@/hooks/usePaywall";
import SupportWidget from "@/components/SupportWidget";
import RouteProgress from "@/components/ui/RouteProgress";

const geistSans = Geist({ subsets: ["latin"], variable: "--font-geist-sans" });
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono" });

const TITLE = "ResolveLabs — ferramentas para contadores, lojistas e devs";
const DESCRIPTION = "Converta PDF para OFX, repare feeds do Google Merchant, otimize imagens em lote, gere dados de teste e inspecione arquivos. Tudo no seu navegador.";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.APP_URL ?? "http://localhost:3000"),
  title: TITLE,
  description: DESCRIPTION,
  applicationName: "ResolveLabs",
  manifest: "/site.webmanifest",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    type: "website",
    siteName: "ResolveLabs",
    locale: "pt_BR",
    title: TITLE,
    description: DESCRIPTION,
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "ResolveLabs" }],
  },
  twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION, images: ["/og-image.png"] },
};

export const viewport: Viewport = { themeColor: "#0f766e" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body
        className={`${geistSans.variable} ${geistMono.variable} font-sans bg-stone-50 text-stone-800 min-h-screen flex flex-col antialiased`}
      >
        <RouteProgress />
        <ToastProvider>
          <AuthProvider>
            <PaywallProvider>
              {children}
              <SupportWidget />
            </PaywallProvider>
          </AuthProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
