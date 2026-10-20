
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";

const ALLOWED_KEYS = ["rate_limit", "max_imei_per_order"];

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user || (user.role !== "admin" && user.role !== "superadmin")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const settings = await prisma.systemSetting.findMany({
      where: { key_name: { in: ALLOWED_KEYS } },
    });

    const result: Record<string, string> = {};
    for (const s of settings) {
      result[s.key_name] = s.value;
    }

    return NextResponse.json({ settings: result });
  } catch (error) {
    console.error("[Settings] GET error:", error);
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user || (user.role !== "admin" && user.role !== "superadmin")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { settings } = body as { settings: Record<string, string> };

    if (!settings || typeof settings !== "object") {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const updates: { key: string; value: string }[] = [];

    for (const [key, value] of Object.entries(settings)) {
      if (!ALLOWED_KEYS.includes(key)) continue;
      updates.push({ key, value: String(value) });
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: "Tidak ada setting yang valid" }, { status: 400 });
    }

    for (const { key, value } of updates) {
      await prisma.systemSetting.upsert({
        where: { key_name: key },
        update: { value },
        create: { key_name: key, value },
      });
    }

    console.log(`[Settings] Updated by ${user.username}: ${updates.map(u => `${u.key}=${u.value}`).join(", ")}`);
    return NextResponse.json({ message: "Pengaturan berhasil disimpan", updated: updates.length });
  } catch (error) {
    console.error("[Settings] POST error:", error);
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 });
  }
}
