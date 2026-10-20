import type { Metadata } from "next";
import { ProfilePageClient } from "./page-client";

export const metadata: Metadata = {
  title: "Profil — Cekbar",
  description: "Kelola profil akun Cekbar Anda",
};

export default function ProfilPage() {
  return <ProfilePageClient />;
}
