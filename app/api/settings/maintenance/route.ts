
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";

export async function GET() {
  try {
    const setting = await prisma.systemSetting.findUnique({
      where: { key_name: "maintenance_mode" },
    });
    const enabled = setting?.value === "true";
    return NextResponse.json({ enabled });
  } catch {
    return NextResponse.json({ enabled: false });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user || (user.role !== "admin" && user.role !== "superadmin")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { enabled } = await req.json();
    if (typeof enabled !== "boolean") {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    await prisma.systemSetting.upsert({
      where: { key_name: "maintenance_mode" },
      update: { value: String(enabled) },
      create: { key_name: "maintenance_mode", value: String(enabled) },
    });

    console.log(`[Settings] Maintenance mode ${enabled ? "AKTIF" : "NONAKTIF"} oleh ${user.username}`);
    return NextResponse.json({ enabled });
  } catch (error) {
    console.error("[Settings] Gagal update maintenance mode:", error);
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 });
  }
}
