import type { Metadata } from "next";
import { KontakPage } from "@/components/kontak/kontak-page";

export const metadata: Metadata = {
  title: "Hubungi Kami — Cekbar",
  description:
    "Ada pertanyaan atau kendala? Hubungi tim Cekbar. Kami siap membantu Anda seputar verifikasi IMEI, status perangkat, dan layanan lainnya.",
};

export default function Kontak() {
  return <KontakPage />;
}
