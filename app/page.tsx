import type { Metadata } from "next";
import { LandingPage } from "@/components/landing/landing-page";

export const metadata: Metadata = {
  title: "Cekbar — Cek IMEI Perangkat, Pastikan Asli & Legal",
  description:
    "Cek status IMEI perangkat Anda secara instan di database CEIR Indonesia. Pastikan perangkat Anda legal dan terdaftar resmi.",
  openGraph: {
    title: "Cekbar — Cek IMEI Perangkat, Pastikan Asli & Legal",
    description:
      "Cek status IMEI perangkat Anda secara instan di database CEIR Indonesia. Pastikan perangkat Anda legal dan terdaftar resmi.",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://cekbar.id/#organization",
      name: "Cekbar",
      url: "https://cekbar.id",
      description:
        "Platform reseller layanan cek IMEI, unlock IMEI, dan GSM service terpercaya di Indonesia.",
    },
    {
      "@type": "WebSite",
      "@id": "https://cekbar.id/#website",
      url: "https://cekbar.id",
      name: "Cekbar",
      publisher: { "@id": "https://cekbar.id/#organization" },
      inLanguage: "id-ID",
    },
    {
      "@type": "WebPage",
      "@id": "https://cekbar.id/",
      url: "https://cekbar.id/",
      name: "Cekbar — Cek IMEI Perangkat, Pastikan Asli & Legal",
      isPartOf: { "@id": "https://cekbar.id/#website" },
      about: { "@id": "https://cekbar.id/#organization" },
      inLanguage: "id-ID",
    },
  ],
};

export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <LandingPage />
    </>
  );
}
