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
    const status = searchParams.get("status");
    const search = searchParams.get("search") ?? "";
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
    const limit = Math.min(50, parseInt(searchParams.get("limit") ?? "20"));
    const offset = (page - 1) * limit;

    const conditions: string[] = ["o.is_manual_order = 1"];
    const bindings: unknown[] = [];

    if (status && status !== "ALL") {
      conditions.push("o.status = ?");
      bindings.push(status);
    }

    if (search) {
      conditions.push(
        "(o.order_id LIKE ? OR o.service_name LIKE ? OR u.username LIKE ? OR u.email LIKE ?)"
      );
      bindings.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }

    const whereClause = conditions.join(" AND ");

    const countResult = await prisma.$queryRawUnsafe<[{ total: bigint }]>(
      `SELECT COUNT(*) AS total FROM orders o JOIN users u ON u.id = o.user_id WHERE ${whereClause}`,
      ...bindings
    );
    const total = Number(countResult[0]?.total ?? 0);

    const rows = await prisma.$queryRawUnsafe<Record<string, unknown>[]>(
      `SELECT
        o.order_id, o.service_id, o.service_name, o.imei_list, o.total_price,
        o.status AS order_status, o.ceir_order_id, o.status_note,
        o.roamer_months, o.results, o.admin_note,
        o.processed_by, o.processed_at,
        o.is_direct_order, o.created_at, o.updated_at, o.completed_at,
        u.id AS user_db_id, u.username, u.email, u.nama,
        p.payment_id, p.total_amount, p.status AS payment_status,
        p.confirmed_at, p.payment_type
      FROM orders o
      JOIN users u ON u.id = o.user_id
      LEFT JOIN payments p ON p.order_id = o.order_id
      WHERE ${whereClause}
      ORDER BY
        CASE o.status
          WHEN 'PENDING' THEN 1
          WHEN 'PROCESSING' THEN 2
          WHEN 'SUCCESS' THEN 3
          WHEN 'FAILED' THEN 4
          ELSE 5
        END,
        o.created_at DESC
      LIMIT ? OFFSET ?`,
      ...bindings,
      limit,
      offset
    );

    const orders = rows.map((row) => {
      let imeiList: string[] = [];
      try {
        imeiList =
          typeof row.imei_list === "string"
            ? JSON.parse(row.imei_list)
            : (row.imei_list as string[]) ?? [];
      } catch {
        imeiList = [];
      }

      let results = null;
      try {
        results =
          typeof row.results === "string"
            ? JSON.parse(row.results)
            : row.results ?? null;
      } catch {
        results = null;
      }

      return {
        orderId: row.order_id,
        serviceId: row.service_id,
        serviceName: row.service_name,
        imeiList,
        totalPrice: Number(row.total_price),
        orderStatus: row.order_status,
        ceirOrderId: row.ceir_order_id ?? null,
        statusNote: row.status_note ?? null,
        roamerMonths: row.roamer_months ?? null,
        results,
        adminNote: row.admin_note ?? null,
        processedBy: row.processed_by ?? null,
        processedAt: row.processed_at ?? null,
        isDirectOrder: !!row.is_direct_order,
        paymentId: row.payment_id ?? null,
        paymentStatus: row.payment_status ?? null,
        totalAmount: row.total_amount ? Number(row.total_amount) : null,
        confirmedAt: row.confirmed_at ?? null,
        paymentType: row.payment_type ?? null,
        username: row.username,
        email: row.email,
        nama: row.nama,
        completedAt: row.completed_at ?? null,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      };
    });

    // Status counts for tabs
    const countRows = await prisma.$queryRawUnsafe<
      { status: string; cnt: bigint }[]
    >(
      `SELECT status, COUNT(*) AS cnt FROM orders WHERE is_manual_order = 1 GROUP BY status`
    );
    const statusCounts: Record<string, number> = {};
    for (const r of countRows) {
      statusCounts[r.status as string] = Number(r.cnt);
    }

    return NextResponse.json({
      orders,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      statusCounts,
    });
  } catch (error) {
    console.error("GET /api/admin/orders/manual error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}

