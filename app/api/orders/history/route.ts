
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";

function categoryToNameCondition(category: string): string {
  switch (category) {
    case "CEIR":
      return `(
        LOWER(o.service_name) LIKE '%check%'
        OR LOWER(o.service_name) LIKE '%cek%'
        OR LOWER(o.service_name) LIKE '%history%'
        OR LOWER(o.service_name) LIKE '%validity%'
        OR LOWER(o.service_name) LIKE '%bea cukai%'
        OR LOWER(o.service_name) LIKE '%ceir%'
        OR LOWER(o.service_name) LIKE '%imei status%'
      )`;
    case "UNLOCK_IMEI":
      return `(
        LOWER(o.service_name) LIKE '%roamer%'
        OR LOWER(o.service_name) LIKE '%unlock%'
        OR LOWER(o.service_name) LIKE '%unblock%'
        OR LOWER(o.service_name) LIKE '%bulan%'
        OR LOWER(o.service_name) LIKE '%tahun%'
      )`;
    case "GSM":
      return `(
        LOWER(o.service_name) LIKE '%carrier%'
        OR LOWER(o.service_name) LIKE '%simlock%'
        OR LOWER(o.service_name) LIKE '%sim-lock%'
        OR LOWER(o.service_name) LIKE '%apple%'
        OR LOWER(o.service_name) LIKE '%icloud%'
        OR LOWER(o.service_name) LIKE '%gsm%'
      )`;
    default:
      return "1=1";
  }
}

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category") ?? "";
    const search   = searchParams.get("search") ?? "";
    const status   = searchParams.get("status") ?? "";
    const page     = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
    const limit    = Math.min(50, parseInt(searchParams.get("limit") ?? "20"));
    const offset   = (page - 1) * limit;

    const nameCond = categoryToNameCondition(category);

    const conditions: string[] = [
      "o.user_id = ?",
      nameCond,
    ];
    const bindings: unknown[] = [user.id];

    if (search) {
      conditions.push("(o.order_id LIKE ? OR o.service_name LIKE ?)");
      bindings.push(`%${search}%`, `%${search}%`);
    }

    if (status) {
      conditions.push("o.status = ?");
      bindings.push(status);
    }

    const whereClause = conditions.join(" AND ");

    const countResult = await prisma.$queryRawUnsafe<[{ total: bigint }]>(
      `SELECT COUNT(*) AS total FROM orders o WHERE ${whereClause}`,
      ...bindings
    );
    const total = Number(countResult[0]?.total ?? 0);

    const rows = await prisma.$queryRawUnsafe<Record<string, unknown>[]>(
      `SELECT
         o.order_id, o.service_id, o.service_name, o.imei_list,
         o.total_price, o.status, o.dhru_order_id, o.ceir_order_id,
         o.roamer_months, o.status_note, o.unit_price,
         o.created_at, o.updated_at, o.completed_at,
         o.results,
         p.payment_id, p.payment_type, p.status AS payment_status, p.confirmed_at
       FROM orders o
       LEFT JOIN payments p ON p.order_id = o.order_id
       WHERE ${whereClause}
       ORDER BY o.created_at DESC
       LIMIT ? OFFSET ?`,
      ...bindings, limit, offset
    );

    const orders = rows.map((row) => {
      let imeiList: string[] = [];
      try {
        imeiList = typeof row.imei_list === "string"
          ? JSON.parse(row.imei_list)
          : (row.imei_list as string[]) ?? [];
      } catch { imeiList = []; }

      let results = null;
      try {
        results = typeof row.results === "string"
          ? JSON.parse(row.results)
          : row.results ?? null;
      } catch { results = null; }

      return {
        orderId:       row.order_id,
        serviceId:     row.service_id,
        serviceName:   row.service_name,
        groupName:     "",
        timeInfo:      "",
        imeiList,
        totalPrice:    Number(row.total_price),
        status:        row.status,
        dhruOrderId:   row.dhru_order_id ?? null,
        ceirOrderId:   row.ceir_order_id ?? null,
        roamerMonths:  row.roamer_months ?? null,
        statusNote:    row.status_note ?? null,
        unitPrice:     row.unit_price ? Number(row.unit_price) : null,
        paymentId:     row.payment_id ?? null,
        paymentType:   row.payment_type ?? null,
        paymentStatus: row.payment_status ?? null,
        confirmedAt:   row.confirmed_at ?? null,
        completedAt:   row.completed_at ?? null,
        createdAt:     row.created_at,
        updatedAt:     row.updated_at,
        results,
      };
    });

    return NextResponse.json({
      orders,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });

  } catch (error) {
    console.error("GET /api/orders/history error:", error);
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 });
  }
}
