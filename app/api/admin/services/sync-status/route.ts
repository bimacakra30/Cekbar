
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const result = await prisma.$queryRaw<[{ last_synced: Date | null; total: bigint }]>`
      SELECT MAX(last_synced_at) as last_synced, COUNT(*) as total FROM services
    `;

    const lastSynced = result[0]?.last_synced;
    const total = Number(result[0]?.total ?? 0);

    let isStale = true;
    let minutesAgo = null;

    if (lastSynced) {
      const diff = Date.now() - new Date(lastSynced).getTime();
      minutesAgo = Math.floor(diff / 60000);
      isStale = diff > 60 * 60 * 1000;
    }

    if (total === 0) {
      isStale = true;
    }

    return NextResponse.json({
      lastSynced,
      total,
      isStale,
      minutesAgo,
    });
  } catch (error) {
    console.error("Sync status error:", error);
    return NextResponse.json(
      { error: "Gagal cek status sync" },
      { status: 500 }
    );
  }
}
