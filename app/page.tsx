import type { Metadata } from "next";
import { LandingPage } from "@/components/landing/landing-page";

export const metadata: Metadata = {
  title: "Cekbar — Cek IMEI Perangkat, Pastikan Asli & Legal",
  description:
    "Verifikasi status IMEI perangkat Anda di database CEIR resmi, cek Apple Carrier & SIMLock, dan pastikan terdaftar di Bea Cukai Indonesia. Jangan beli perangkat sebelum cek IMEI!",
};

export default function Home() {
  return <LandingPage />;
}
