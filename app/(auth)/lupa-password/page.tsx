import type { Metadata } from "next";
import { ForgotPasswordClient } from "./page-client";

export const metadata: Metadata = {
  title: "Lupa Password — Cekbar",
  description: "Reset password akun Cekbar Anda",
};

export default function ForgotPasswordPage() {
  return <ForgotPasswordClient />;
}
