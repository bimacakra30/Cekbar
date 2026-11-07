import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { sessionOptions, type SessionData } from "@/lib/session";
import prisma from "@/lib/prisma";
import { getBalance } from "@/lib/ceirid";

export async function GET(req: NextRequest) {
  try {
    const res = NextResponse.next();
    const session = await getIronSession<SessionData>(req, res, sessionOptions);

    if (!session.isLoggedIn || !session.id) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    let role = session.role;

    try {
      const dbUser = await prisma.user.findUnique({
        where: { id: session.id },
        select: { role: true, status: true },
      });

      if (dbUser) {
        if (dbUser.status !== "active") {
          return NextResponse.json({ user: null }, { status: 401 });
        }
        role = dbUser.role;
      }
    } catch {
      // DB gagal, pakai role dari session
    }

    const result: Record<string, unknown> = {
      user: {
        id: session.id,
        nama: session.nama,
        username: session.username,
        email: session.email,
        role,
      },
    };

    if (role === "reseller") {
      let activeUsers = 0;
      let ceirBalance: number | null = null;

      try {
        activeUsers = await prisma.user.count({ where: { status: "active", role: "user" } });
      } catch {}

      try {
        const balance = await getBalance();
        ceirBalance = balance?.credit ?? null;
      } catch {}

      result.resellerInfo = { activeUsers, ceirBalance };
    }

    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ user: null }, { status: 401 });
  }
}
