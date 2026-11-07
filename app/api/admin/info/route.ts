import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { getBalance } from "@/lib/ceirid";

export async function GET(req: NextRequest) {
  try {
    const sessionUser = await getSessionUser(req);
    console.log("[Admin Info] sessionUser:", sessionUser?.id, "role:", sessionUser?.role);

    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: sessionUser.id },
      select: { role: true, status: true },
    });
    console.log("[Admin Info] dbUser:", dbUser);

    if (!dbUser || dbUser.status !== "active" || dbUser.role !== "reseller") {
      console.log("[Admin Info] REJECTED - role:", dbUser?.role, "status:", dbUser?.status);
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    let activeUsers = 0;
    let ceirBalance: number | null = null;

    try {
      activeUsers = await prisma.user.count({ where: { status: "active", role: "user" } });
      console.log("[Admin Info] activeUsers count:", activeUsers);
    } catch (e) {
      console.error("[Admin Info] Count users FAILED:", e);
    }

    try {
      const balance = await getBalance();
      console.log("[Admin Info] balance response:", balance);
      ceirBalance = balance?.credit ?? null;
    } catch (e) {
      console.error("[Admin Info] getBalance FAILED:", e);
      ceirBalance = null;
    }

    console.log("[Admin Info] RETURNING:", { activeUsers, ceirBalance });
    return NextResponse.json({ activeUsers, ceirBalance });
  } catch (error) {
    console.error("[Admin Info] OUTER ERROR:", error);
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 });
  }
}
