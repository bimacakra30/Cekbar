import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { sessionOptions, type SessionData } from "@/lib/session";

// ── Rute yang SELALU lolos — maintenance atau tidak ──────────────────────────
// Termasuk /login & /register agar admin yang logout tetap bisa masuk kembali
const ALWAYS_PUBLIC = ["/login", "/register", "/lupa-password", "/reset-password", "/api/auth", "/api/webhooks", "/api/settings/maintenance", "/kontak", "/syarat-ketentuan"];

// Cache maintenance status — refresh tiap 30 detik agar tidak hit DB tiap request
let _maintenanceCache: { enabled: boolean; ts: number } | null = null;

async function isMaintenanceEnabled(req: NextRequest): Promise<boolean> {
  const now = Date.now();
  if (_maintenanceCache && now - _maintenanceCache.ts < 30_000) {
    return _maintenanceCache.enabled;
  }
  try {
    const origin = req.nextUrl.origin;
    const res = await fetch(`${origin}/api/settings/maintenance`, { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      _maintenanceCache = { enabled: !!data.enabled, ts: now };
      return !!data.enabled;
    }
  } catch {
    // Gagal fetch → asumsikan tidak maintenance (fail-open agar tidak lockout)
  }
  return false;
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 1️⃣ Auth & API publik — SELALU lolos, tidak peduli maintenance
  //    /login dan /register di sini agar admin tidak terkunci saat maintenance aktif
  if (ALWAYS_PUBLIC.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // 2️⃣ Halaman /maintenance — hanya bisa diakses saat maintenance aktif
  if (pathname === "/maintenance") {
    const maintenance = await isMaintenanceEnabled(req);
    return maintenance
      ? NextResponse.next()
      : NextResponse.redirect(new URL("/", req.url));
  }

  // 3️⃣ Baca session untuk tahu role user
  const res = NextResponse.next();
  let role = "user";
  let isLoggedIn = false;

  try {
    const session = await getIronSession<SessionData>(req, res, sessionOptions);
    isLoggedIn = !!session.isLoggedIn && !!session.id;
    role = session.role || "user";
  } catch {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const isAdminRole = role === "admin" || role === "superadmin";

  // 4️⃣ Cek maintenance — hanya untuk non-admin
  //    Admin tetap bisa akses semua halaman saat maintenance
  if (!isAdminRole) {
    const maintenance = await isMaintenanceEnabled(req);
    if (maintenance && !pathname.startsWith("/api/")) {
      return NextResponse.redirect(new URL("/maintenance", req.url));
    }
  }

  // 5️⃣ Halaman landing (/) — izinkan setelah cek maintenance
  if (pathname === "/") {
    return NextResponse.next();
  }

  // 6️⃣ Tidak login → redirect ke login
  if (!isLoggedIn) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const isAdminRoute = pathname.startsWith("/admin") || pathname.startsWith("/api/admin");
  const isUserRoute = !isAdminRoute && !pathname.startsWith("/api/auth");

  // 7️⃣ Admin/superadmin tidak boleh akses panel user → redirect ke /admin
  if (isAdminRole && isUserRoute && !pathname.startsWith("/api/")) {
    return NextResponse.redirect(new URL("/admin", req.url));
  }

  // 8️⃣ User biasa tidak boleh akses panel admin → redirect ke dashboard
  if (!isAdminRole && isAdminRoute) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|public).*)"],
};
