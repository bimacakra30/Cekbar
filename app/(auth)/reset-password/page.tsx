import type { Metadata } from "next";
import { Suspense } from "react";
import { ResetPasswordClient } from "./page-client";

export const metadata: Metadata = {
  title: "Reset Password — Cekbar",
  description: "Buat password baru untuk akun Cekbar Anda",
};

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-5 h-5 border-2 border-muted-foreground/30 border-t-muted-foreground rounded-full animate-spin" />
      </div>
    }>
      <ResetPasswordClient />
    </Suspense>
  );
}
