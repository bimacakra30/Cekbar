import type { Metadata } from "next";
import { RegisterClient } from "./page-client";

export const metadata: Metadata = {
  title: "Daftar Akun",
  description: "Buat akun Cekbar untuk mulai menggunakan layanan cek IMEI dan GSM service.",
};

export default function RegisterPage() {
  return <RegisterClient />;
}
