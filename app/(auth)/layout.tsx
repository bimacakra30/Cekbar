import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cekbar — Login / Register",
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen w-full">{children}</div>;
}
