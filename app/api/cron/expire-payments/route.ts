// Contoh cron: setiap 5 menit → curl https://domain.com/api/cron/expire-payments?key=SECRET

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const key = req.nextUrl.searchParams.get("key");
    const expectedKey = process.env.CRON_SECRET ?? "";
    if (expectedKey && key !== expectedKey) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payResult = await prisma.payment.updateMany({
      where: {
        status: "MENUNGGU",
        expires_at: { not: null, lt: new Date() },
      },
      data: { status: "KADALUARSA" },
    });

    const ordResult = await prisma.$executeRaw`
      UPDATE orders SET status = 'EXPIRED'
      WHERE status = 'PENDING_PAYMENT'
      AND order_id IN (
        SELECT order_id FROM payments WHERE status = 'KADALUARSA'
      )
    `;

    console.log(`[Cron] Expired ${payResult.count} payments, ${ordResult} orders`);

    return NextResponse.json({
      message: "OK",
      expiredPayments: payResult.count,
      expiredOrders: ordResult,
    });

  } catch (error) {
    console.error("[Cron] expire-payments error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
