
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user || (user.role !== "admin" && user.role !== "superadmin")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const rows = await prisma.$queryRaw<Record<string, unknown>[]>`
      SELECT p.payment_id, p.order_id, p.total_amount, p.payment_type,
             p.confirmed_at, p.created_at,
             o.service_name, o.imei_list,
             s.buy_price
      FROM payments p
      JOIN orders o ON o.order_id = p.order_id
      JOIN services s ON s.service_id = o.service_id
      WHERE p.status = 'LUNAS'
      ORDER BY COALESCE(p.confirmed_at, p.created_at) DESC
      LIMIT 100
    `;

    type Trx = {
      id: string;
      type: "IN" | "OUT";
      description: string;
      relatedOrder: string;
      amount: number;
      date: Date | string;
    };

    const transactions: Trx[] = [];
    let trxIndex = 0;

    for (const row of rows) {
      trxIndex++;
      const imeiList = (() => {
        try {
          const raw = row.imei_list;
          if (Array.isArray(raw)) return raw;
          if (typeof raw === "string") return JSON.parse(raw);
          return [];
        } catch {
          return [];
        }
      })();
      const imeiCount = imeiList.length || 1;

      const paymentType = row.payment_type
        ? String(row.payment_type).replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase())
        : "QRIS";

      const serviceName = String(row.service_name ?? "");
      const date = (row.confirmed_at ?? row.created_at) as Date | string;

      transactions.push({
        id: `TRX-${String(trxIndex).padStart(3, "0")}`,
        type: "IN",
        description: `Pembayaran ${paymentType} — ${serviceName}${imeiCount > 1 ? ` (${imeiCount} IMEI)` : ""}`,
        relatedOrder: String(row.order_id),
        amount: Number(row.total_amount),
        date,
      });

      const buyPrice = Number(row.buy_price ?? 0);
      const sellerCost = buyPrice * imeiCount;
      if (sellerCost > 0) {
        trxIndex++;
        transactions.push({
          id: `TRX-${String(trxIndex).padStart(3, "0")}`,
          type: "OUT",
          description: `Setoran ke Seller — ${serviceName}${imeiCount > 1 ? ` (${imeiCount} IMEI × ${buyPrice.toLocaleString("id-ID")})` : ""}`,
          relatedOrder: String(row.order_id),
          amount: sellerCost,
          date,
        });
      }
    }

    const totalIn = transactions.filter(t => t.type === "IN").reduce((sum, t) => sum + t.amount, 0);
    const totalOut = transactions.filter(t => t.type === "OUT").reduce((sum, t) => sum + t.amount, 0);

    return NextResponse.json({
      transactions,
      summary: {
        totalIn,
        totalOut,
        profit: totalIn - totalOut,
      },
    });
  } catch (error) {
    console.error("GET /api/admin/transactions error:", error);
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 });
  }
}
