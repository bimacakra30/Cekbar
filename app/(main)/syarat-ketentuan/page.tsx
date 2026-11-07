import type { Metadata } from "next";
import { SyaratKetentuanClient } from "./page-client";

export const metadata: Metadata = {
  title: "Syarat & Ketentuan",
  description: "Syarat dan ketentuan penggunaan layanan Cekbar.",
};

export default function SyaratKetentuanPage() {
  return <SyaratKetentuanClient />;
}
