import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function useRedirectIfLoggedIn() {
  const router = useRouter();

  useEffect(() => {
    async function checkSession() {
      try {
        const res = await fetch("/api/auth/me", { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          if (data.user) {
            if (data.user.role === "admin" || data.user.role === "superadmin") {
              router.replace("/admin");
            } else {
              router.replace("/dashboard");
            }
          }
        }
      } catch {}
    }
    checkSession();
  }, [router]);
}
