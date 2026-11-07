import type { Metadata } from "next";
import { LoginClient } from "./page-client";

export const metadata: Metadata = {
  title: "Login",
  description: "Masuk ke akun Cekbar untuk mengakses layanan cek IMEI dan GSM service.",
};

export default function LoginPage() {
  return <LoginClient />;
}
