import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { processOrderAfterPayment } from "@/lib/process-order";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

    const stuckOrders = await prisma.order.findMany({
      where: {
        status: "PENDING",
        updated_at: { lt: fiveMinutesAgo },
      },
      select: { order_id: true, service_name: true, updated_at: true },
      take: 10,
    });

    if (stuckOrders.length === 0) {
      return NextResponse.json({ message: "Tidak ada order stuck", processed: 0 });
    }

    const results: { orderId: string; success: boolean; error?: string }[] = [];

    for (const order of stuckOrders) {
      try {
        await processOrderAfterPayment(order.order_id);
        results.push({ orderId: order.order_id, success: true });
      } catch (err) {
        const e = err as Error;
        results.push({ orderId: order.order_id, success: false, error: e.message });

        await prisma.order.update({
          where: { order_id: order.order_id },
          data: {
            status: "FAILED",
            status_note: `Retry gagal: ${e.message}`.slice(0, 255),
          },
        }).catch(() => {});
      }
    }

    return NextResponse.json({
      message: `Retry ${stuckOrders.length} order stuck`,
      processed: results.length,
      results,
    });
  } catch (error) {
    console.error("POST /api/cron/process-pending error:", error);
    return NextResponse.json({ error: "Gagal retry order" }, { status: 500 });
  }
}
