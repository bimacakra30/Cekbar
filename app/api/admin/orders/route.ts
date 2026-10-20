
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user || (user.role !== "admin" && user.role !== "superadmin")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const paymentStatus = searchParams.get("paymentStatus");
    const orderStatus = searchParams.get("orderStatus");

    const conditions: string[] = [];
    const params: unknown[] = [];

    if (paymentStatus) {
      conditions.push("p.status = ?");
      params.push(paymentStatus);
    }
    if (orderStatus) {
      conditions.push("o.status = ?");
      params.push(orderStatus);
    }

    const whereClause = conditions.length > 0 ? "WHERE " + conditions.join(" AND ") : "";

    const rows = await prisma.$queryRawUnsafe<Record<string, unknown>[]>(
      `SELECT 
        o.order_id, o.service_name, o.imei_list, o.total_price, o.status AS order_status,
        o.ceir_order_id, o.status_note, o.roamer_months, o.results,
        o.created_at, o.updated_at, o.completed_at,
        u.username, u.email, u.nama,
        p.payment_id, p.total_amount, p.status AS payment_status,
        p.confirmed_at, p.payment_type, p.gopay_transaction_id
      FROM orders o
      JOIN users u ON u.id = o.user_id
      LEFT JOIN payments p ON p.order_id = o.order_id
      ${whereClause}
      ORDER BY o.created_at DESC LIMIT 200`,
      ...params
    );

    const orders = rows.map((row) => {
      let results = null;
      try {
        results = typeof row.results === "string" ? JSON.parse(row.results) : row.results ?? null;
      } catch { results = null; }

      return {
        orderId: row.order_id,
        serviceName: row.service_name,
        imeiList: typeof row.imei_list === "string" ? JSON.parse(row.imei_list as string) : row.imei_list,
        totalPrice: Number(row.total_price),
        orderStatus: row.order_status,
        ceirOrderId: row.ceir_order_id ?? null,
        statusNote: row.status_note ?? null,
        roamerMonths: row.roamer_months ?? null,
        results,
        paymentId: row.payment_id,
        paymentStatus: row.payment_status,
        totalAmount: Number(row.total_amount),
        username: row.username,
        email: row.email,
        nama: row.nama,
        confirmedAt: row.confirmed_at,
        completedAt: row.completed_at ?? null,
        createdAt: row.created_at,
      };
    });

    return NextResponse.json({ orders });
  } catch (error) {
    console.error("GET /api/admin/orders error:", error);
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 });
  }
}
