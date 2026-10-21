
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { createQrisPayment, getGopayApiUrl } from "@/lib/gopay";
import { getSessionUser } from "@/lib/session";
import { getBalance } from "@/lib/ceirid";

function generateId(type: "ORD" | "PAY"): string {
  const ts = new Date().toISOString().replace(/[-:T.Z]/g, "").slice(2, 14);
  const rand = Math.floor(Math.random() * 9000 + 1000);
  return `CEKBAR-${type}-${ts}-${rand}`;
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { serviceId, serviceName, imeiList } = body;

    if (!serviceId || !serviceName || !Array.isArray(imeiList) || imeiList.length === 0) {
      return NextResponse.json({ error: "Data order tidak lengkap" }, { status: 400 });
    }

    const dbService = await prisma.service.findFirst({
      where: { service_name: serviceName },
      select: {
        service_id: true,
        service_name: true,
        sell_price: true,
        buy_price: true,
        is_active: true,
        api_provider: true,
      },
    });

    if (!dbService) {
      return NextResponse.json({ error: "Layanan tidak ditemukan" }, { status: 404 });
    }

    if (!dbService.is_active) {
      return NextResponse.json({ error: "Layanan sedang tidak tersedia" }, { status: 400 });
    }

    const pricePerUnit = Number(dbService.sell_price);

    if (pricePerUnit <= 0) {
      return NextResponse.json({ error: "Harga layanan belum diatur oleh admin" }, { status: 400 });
    }

    const totalPrice = imeiList.length * pricePerUnit;

    // ── Pre-check saldo CEIR sebelum buat order ──────────────────────
    if (dbService.api_provider === "ceir") {
      const buyPricePerUnit = Number(dbService.buy_price);
      const totalBuyCost = imeiList.length * buyPricePerUnit;

      try {
        const balanceData = await getBalance();
        const currentCredit = balanceData.credit;

        console.log(
          `[Order] CEIR balance check: credit=${currentCredit}, needed=${totalBuyCost} (${imeiList.length} × ${buyPricePerUnit})`
        );

        if (currentCredit < totalBuyCost) {
          return NextResponse.json(
            {
              error: "Layanan sedang tidak tersedia untuk saat ini. Silakan hubungi admin.",
              errorCode: "INSUFFICIENT_PROVIDER_BALANCE",
            },
            { status: 503 }
          );
        }
      } catch (balanceErr) {
        console.error("[Order] Gagal cek saldo CEIR:", balanceErr);
        return NextResponse.json(
          {
            error: "Tidak dapat memverifikasi ketersediaan layanan. Silakan coba beberapa saat lagi.",
            errorCode: "PROVIDER_UNAVAILABLE",
          },
          { status: 503 }
        );
      }
    }
    // ────────────────────────────────────────────────────────────────

    const orderId = generateId("ORD");
    const paymentId = generateId("PAY");

    const expiresInSeconds = 600;
    const expiresAt = new Date(Date.now() + expiresInSeconds * 1000);

    const appUrl = (process.env.APP_URL || "").replace(/\/+$/, "");
    const callbackUrl = appUrl ? `${appUrl}/api/webhooks/gopay` : "";

    await prisma.order.create({
      data: {
        order_id: orderId,
        user_id: user.id,
        service_id: dbService.service_id,
        service_name: dbService.service_name,
        imei_list: imeiList,
        total_price: totalPrice,
        status: "PENDING_PAYMENT",
      },
    });

    await prisma.payment.create({
      data: {
        payment_id: paymentId,
        order_id: orderId,
        amount: totalPrice,
        fee: 0,
        total_amount: totalPrice,
        status: "MENUNGGU",
        expires_at: expiresAt,
      },
    });

    let qrisId = "";
    let trxId = "";
    let qrImage = "";
    let qrisUrl = "";
    try {
      const qrisResult = await createQrisPayment({
        amount: totalPrice,
        callbackUrl,
        expiresIn: expiresInSeconds,
      });

      qrisId = qrisResult.qrisId;
      trxId = qrisResult.trxId;
      qrImage = qrisResult.qrImage;
      qrisUrl = qrisResult.qrisUrl;

      await prisma.payment.update({
        where: { payment_id: paymentId },
        data: { qris_id: qrisId, trx_id: trxId, qr_image: qrImage, qris_url: qrisUrl },
      });
    } catch (gopayError) {
      console.error("[GoPay] Gagal buat QRIS:", gopayError);
    }

    const gopayApiUrl = getGopayApiUrl();

    return NextResponse.json({
      orderId,
      paymentId,
      totalPrice,
      fee: 0,
      totalAmount: totalPrice,
      qrisId,
      trxId,
      qrImage,
      qrisUrl,
      gopayApiUrl,
      expiresAt: expiresAt.toISOString(),
      serviceName: dbService.service_name,
    }, { status: 201 });

  } catch (error) {
    console.error("POST /api/orders error:", error);
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const dbOrders = await prisma.order.findMany({
      where: { user_id: user.id },
      include: {
        payments: {
          select: {
            payment_id: true,
            total_amount: true,
            status: true,
            payment_type: true,
            qris_id: true,
          },
          take: 1,
        },
      },
      orderBy: { created_at: "desc" },
      take: 50,
    });

    const orders = dbOrders.map((o) => {
      const p = o.payments[0];
      return {
        orderId: o.order_id,
        serviceId: o.service_id,
        serviceName: o.service_name,
        imeiList: o.imei_list,
        totalPrice: Number(o.total_price),
        status: o.status,
        ceirOrderId: o.ceir_order_id ?? null,
        paymentId: p?.payment_id ?? null,
        paymentStatus: p?.status ?? null,
        paymentType: p?.payment_type ?? null,
        qrisId: p?.qris_id ?? null,
        results: o.results ?? null,
        createdAt: o.created_at,
        completedAt: o.completed_at ?? null,
      };
    });

    return NextResponse.json({ orders });
  } catch (error) {
    console.error("GET /api/orders error:", error);
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 });
  }
}
