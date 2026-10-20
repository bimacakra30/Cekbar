
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { getBalance } from "@/lib/ceirid";

function getDateFilter(range: string, column = "o.created_at"): string {
  switch (range) {
    case "week":  return `AND ${column} >= DATE_SUB(NOW(), INTERVAL 7 DAY)`;
    case "month": return `AND ${column} >= DATE_SUB(NOW(), INTERVAL 30 DAY)`;
    default:      return `AND DATE(${column}) = CURDATE()`;
  }
}

function getPayDateFilter(range: string, column = "p.confirmed_at"): string {
  switch (range) {
    case "week":  return `AND ${column} >= DATE_SUB(NOW(), INTERVAL 7 DAY)`;
    case "month": return `AND ${column} >= DATE_SUB(NOW(), INTERVAL 30 DAY)`;
    default:      return `AND DATE(${column}) = CURDATE()`;
  }
}

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user || (user.role !== "admin" && user.role !== "superadmin")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const range = searchParams.get("range") ?? "today";

    const orderDateFilter  = getDateFilter(range);
    const payDateFilter    = getPayDateFilter(range);

    const revenueRows = await prisma.$queryRawUnsafe<[{ total: number }]>(
      `SELECT COALESCE(SUM(total_amount), 0) AS total FROM payments p WHERE p.status = 'LUNAS' ${payDateFilter}`
    );
    const totalRevenue = Number(revenueRows[0]?.total ?? 0);

    const sellerRows = await prisma.$queryRawUnsafe<[{ total: number }]>(
      `SELECT COALESCE(SUM(s.buy_price * JSON_LENGTH(o.imei_list)), 0) AS total
       FROM orders o
       JOIN payments p ON p.order_id = o.order_id
       JOIN services s ON s.service_id = o.service_id
       WHERE p.status = 'LUNAS' ${payDateFilter}`
    );
    const totalSeller = Number(sellerRows[0]?.total ?? 0);

    const netRevenue = totalRevenue - totalSeller;

    const orderCountRows = await prisma.$queryRawUnsafe<[{ total: bigint }]>(
      `SELECT COUNT(*) AS total FROM orders o WHERE 1=1 ${orderDateFilter}`
    );
    const totalOrders = Number(orderCountRows[0]?.total ?? 0);

    const failedRows = await prisma.$queryRawUnsafe<[{ total: bigint }]>(
      `SELECT COUNT(*) AS total FROM orders o WHERE o.status = 'FAILED' ${orderDateFilter}`
    );
    const totalFailed = Number(failedRows[0]?.total ?? 0);

    const activeUsers = await prisma.user.count({
      where: { status: "active", role: "user" },
    });

    const todayRows = await prisma.$queryRaw<[{ total: bigint }]>`
      SELECT COUNT(*) AS total FROM orders WHERE DATE(created_at) = CURDATE()
    `;
    const ordersToday = Number(todayRows[0]?.total ?? 0);

    const pendingOrders = await prisma.order.count({
      where: { status: { in: ["PENDING_PAYMENT", "PENDING"] } },
    });

    const successRows = await prisma.$queryRawUnsafe<[{ total: bigint }]>(
      `SELECT COUNT(*) AS total FROM orders o WHERE o.status = 'SUCCESS' ${orderDateFilter}`
    );
    const totalSuccess = Number(successRows[0]?.total ?? 0);

    const revenueChartRows = await prisma.$queryRaw<{ day: Date; revenue: number; count: bigint }[]>`
      SELECT DATE(confirmed_at) AS day,
              COALESCE(SUM(total_amount), 0) AS revenue,
              COUNT(*) AS count
       FROM payments
       WHERE status = 'LUNAS'
         AND confirmed_at >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
       GROUP BY DATE(confirmed_at)
       ORDER BY day ASC
    `;

    const last7Days: { day: string; revenue: number; count: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayStr = d.toISOString().slice(0, 10);
      const found = revenueChartRows.find((r) => {
        const rDay = typeof r.day === "string" ? r.day : (r.day as Date).toISOString().slice(0, 10);
        return rDay === dayStr;
      });
      last7Days.push({
        day: dayStr,
        revenue: found ? Number(found.revenue) : 0,
        count: found ? Number(found.count) : 0,
      });
    }

    const statusRows = await prisma.$queryRaw<{ status: string; total: bigint }[]>`
      SELECT status, COUNT(*) AS total FROM orders GROUP BY status
    `;
    const statusChart = statusRows.map((r) => ({
      status: r.status,
      total: Number(r.total),
    }));

    const topServiceRows = await prisma.$queryRaw<{ service_name: string; total: bigint; revenue: number }[]>`
      SELECT service_name, COUNT(*) AS total, COALESCE(SUM(total_price),0) AS revenue
       FROM orders
       GROUP BY service_name
       ORDER BY total DESC
       LIMIT 5
    `;
    const topServices = topServiceRows.map((r) => ({
      name: r.service_name,
      orders: Number(r.total),
      revenue: Number(r.revenue),
    }));

    const recentRows = await prisma.$queryRawUnsafe<Record<string, unknown>[]>(
      `SELECT o.order_id, u.username, o.service_name, o.total_price, o.status, o.created_at,
              p.payment_type
       FROM orders o
       JOIN users u ON u.id = o.user_id
       LEFT JOIN payments p ON p.order_id = o.order_id
       WHERE 1=1 ${orderDateFilter}
       ORDER BY o.created_at DESC
       LIMIT 20`
    );
    const recentOrders = recentRows.map((row) => ({
      id: row.order_id,
      user: row.username,
      service: row.service_name,
      amount: Number(row.total_price),
      status: row.status,
      paymentType: row.payment_type ?? null,
      date: row.created_at,
    }));

    let ceirBalance: number | null = null;
    try {
      const balanceData = await getBalance();
      ceirBalance = balanceData.credit;
    } catch (err) {
      console.error("[Admin Stats] Gagal fetch saldo CEIR:", err);
    }

    return NextResponse.json({
      stats: {
        totalRevenue,
        totalSeller,
        netRevenue,
        totalOrders,
        totalSuccess,
        totalFailed,
        activeUsers,
        ordersToday,
        pendingOrders,
        ceirBalance,
      },
      charts: {
        dailyRevenue: last7Days,
        statusChart,
        topServices,
      },
      recentOrders,
      range,
    });
  } catch (error) {
    console.error("GET /api/admin/stats error:", error);
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 });
  }
}
