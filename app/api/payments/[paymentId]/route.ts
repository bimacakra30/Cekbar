
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { getGopayApiUrl } from "@/lib/gopay";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ paymentId: string }> }
) {
  try {
    const { paymentId } = await params;

    const user = await getSessionUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payment = await prisma.payment.findUnique({
      where: { payment_id: paymentId },
      include: {
        order: {
          select: { service_name: true, user_id: true },
        },
      },
    });

    if (!payment) {
      return NextResponse.json({ error: "Payment tidak ditemukan" }, { status: 404 });
    }

    if (payment.order.user_id !== user.id && user.role !== "admin" && user.role !== "superadmin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    let currentStatus = payment.status;
    if (payment.status === "MENUNGGU" && payment.expires_at) {
      if (Date.now() > payment.expires_at.getTime()) {
        await prisma.payment.update({
          where: { payment_id: paymentId, status: "MENUNGGU" },
          data: { status: "KADALUARSA" },
        });
        await prisma.order.updateMany({
          where: { order_id: payment.order_id, status: "PENDING_PAYMENT" },
          data: { status: "EXPIRED" },
        });
        currentStatus = "KADALUARSA";
      }
    }

    return NextResponse.json({
      paymentId: payment.payment_id,
      orderId: payment.order_id,
      serviceName: payment.order.service_name,
      amount: Number(payment.amount),
      fee: Number(payment.fee),
      totalAmount: Number(payment.total_amount),
      status: currentStatus,
      createdAt: payment.created_at,
      expiresAt: payment.expires_at,
      confirmedAt: payment.confirmed_at,
      qrisId: payment.qris_id ?? "",
      trxId: payment.trx_id ?? "",
      qrImage: payment.qr_image ?? "",
      qrisUrl: payment.qris_url ?? "",
      gopayTransactionId: payment.gopay_transaction_id ?? "",
      payerIssuer: payment.payer_issuer ?? "",
      paymentType: payment.payment_type ?? "",
      gopayApiUrl: getGopayApiUrl(),
    });

  } catch (error) {
    console.error("GET /api/payments/[paymentId] error:", error);
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 });
  }
}
