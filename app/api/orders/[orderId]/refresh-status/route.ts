
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import type { Prisma } from "@prisma/client";
import { getRoamerOrderStatus, getCeirOrderStatus, mapCeiridOrderStatus } from "@/lib/ceirid";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const user = await getSessionUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { orderId } = await params;

    const rows = await prisma.$queryRaw<Record<string, unknown>[]>`
      SELECT o.order_id, o.user_id, o.status, o.ceir_order_id, o.roamer_months, o.status_note, o.results,
             s.api_type
      FROM orders o
      LEFT JOIN services s ON s.service_name = o.service_name
      WHERE o.order_id = ${orderId} AND o.user_id = ${user.id} LIMIT 1
    `;

    if (rows.length === 0) {
      return NextResponse.json({ error: "Order tidak ditemukan" }, { status: 404 });
    }

    const order = rows[0];
    const apiType = String(order.api_type ?? "");

    if (order.status === "SUCCESS" || order.status === "FAILED") {
      let results = null;
      try {
        results = typeof order.results === "string"
          ? JSON.parse(order.results)
          : order.results ?? null;
      } catch { results = null; }

      return NextResponse.json({
        orderId: order.order_id,
        status: order.status,
        statusNote: order.status_note,
        results,
        final: true,
      });
    }

    if (apiType === "roamer" && order.ceir_order_id) {
      const ceirStatus = await getRoamerOrderStatus(String(order.ceir_order_id));
      const newDbStatus = mapCeiridOrderStatus(ceirStatus.order_status);
      const newStatusNote = ceirStatus.status_note === "-"
        ? "Menunggu proses..."
        : ceirStatus.status_note;

      if (newDbStatus !== order.status || newStatusNote !== order.status_note) {
        await prisma.order.update({
          where: { order_id: orderId },
          data: {
            status: newDbStatus as "PENDING" | "PROCESSING" | "SUCCESS" | "FAILED",
            status_note: newStatusNote,
            completed_at: newDbStatus === "SUCCESS" ? new Date() : undefined,
          },
        });
      }

      return NextResponse.json({
        orderId: order.order_id,
        status: newDbStatus,
        statusNote: newStatusNote,
        ceirStatus: ceirStatus.order_status,
        adminNote: ceirStatus.admin_note,
        final: newDbStatus === "SUCCESS" || newDbStatus === "FAILED",
      });
    }

    if (apiType === "ceir" && order.ceir_order_id) {
      const ceirStatus = await getCeirOrderStatus(String(order.ceir_order_id));

      if (ceirStatus.result && !order.results) {
        await prisma.order.update({
          where: { order_id: orderId },
          data: {
            results: {
              ceir_order_id: ceirStatus.order_id,
              result: ceirStatus.result as unknown,
              ...(ceirStatus.processed !== undefined && { processed: ceirStatus.processed }),
              ...(ceirStatus.total_potong !== undefined && { total_potong: ceirStatus.total_potong }),
              ...(ceirStatus.transaction_id !== undefined && { transaction_id: ceirStatus.transaction_id }),
            } as unknown as Prisma.InputJsonValue,
            status: "SUCCESS",
            completed_at: new Date(),
          },
        });
      }

      return NextResponse.json({
        orderId: order.order_id,
        status: "SUCCESS",
        ceirOrderStatus: ceirStatus.status,
        result: ceirStatus.result,
        final: true,
      });
    }

    return NextResponse.json({
      orderId: order.order_id,
      status: order.status,
      statusNote: order.status_note,
      message: "Tidak bisa poll status dari CEIR (ceir_order_id tidak ada)",
    });

  } catch (error) {
    console.error("[Refresh Status] Error:", error);
    return NextResponse.json({ error: "Gagal cek status" }, { status: 500 });
  }
}
