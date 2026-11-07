import type { Metadata } from "next";
import { Inter, Bricolage_Grotesque } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { ToastProvider } from "@/components/ui/toast";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
  weight: ["400", "600", "800"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.APP_URL || "https://cekbar.id"),
  title: {
    default: "Cekbar — Platform Reseller IMEI & GSM Service",
    template: "%s — Cekbar",
  },
  description:
    "Platform reseller layanan cek IMEI, unlock IMEI, dan GSM service terpercaya di Indonesia. Cek status perangkat Anda secara real-time.",
  openGraph: {
    title: "Cekbar — Platform Reseller IMEI & GSM Service",
    description:
      "Platform reseller layanan cek IMEI, unlock IMEI, dan GSM service terpercaya di Indonesia.",
    siteName: "Cekbar",
    locale: "id_ID",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Cekbar — Platform Reseller IMEI & GSM Service",
    description:
      "Platform reseller layanan cek IMEI, unlock IMEI, dan GSM service terpercaya di Indonesia.",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={`${inter.variable} ${bricolage.variable} h-full antialiased`} suppressHydrationWarning>
      <body className="min-h-full">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[9999] focus:px-4 focus:py-2 focus:bg-background focus:text-foreground focus:rounded-lg focus:border focus:border-border focus:shadow-lg focus:text-sm focus:font-medium"
        >
          Langsung ke konten
        </a>
        <ThemeProvider>
          <ToastProvider>
            {children}
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
