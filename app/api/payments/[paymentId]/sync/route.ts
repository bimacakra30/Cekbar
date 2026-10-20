
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { checkQrStatus } from "@/lib/gopay";
import { getSessionUser } from "@/lib/session";
import { processOrderAfterPayment } from "@/lib/process-order";

export async function POST(
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
        order: { select: { user_id: true, order_id: true } },
      },
    });

    console.log(`[Sync] Looking for paymentId="${paymentId}", found ${payment ? 1 : 0} rows`);

    if (!payment) {
      return NextResponse.json({ error: "Payment tidak ditemukan" }, { status: 404 });
    }

    if (payment.order.user_id !== user.id && user.role !== "admin" && user.role !== "superadmin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (payment.status !== "MENUNGGU") {
      return NextResponse.json({ status: payment.status, synced: false, message: "Status sudah final" });
    }

    if (!payment.qris_id) {
      return NextResponse.json({ status: payment.status, synced: false, message: "Data QRIS belum tersedia" });
    }

    try {
      const qrResult = await checkQrStatus(payment.qris_id);
      console.log(`[Sync] qr-status for ${paymentId}: status=${qrResult.status}, paid=${qrResult.paid}`);

      if (qrResult.status === "EXPIRED") {
        await prisma.payment.updateMany({
          where: { payment_id: paymentId, status: "MENUNGGU" },
          data: { status: "KADALUARSA" },
        });
        await prisma.order.updateMany({
          where: { order_id: payment.order_id, status: "PENDING_PAYMENT" },
          data: { status: "EXPIRED" },
        });
        return NextResponse.json({ status: "KADALUARSA", synced: true, message: "QRIS sudah kadaluarsa" });
      }

      if (!qrResult.paid || qrResult.status !== "PAID") {
        return NextResponse.json({ status: payment.status, synced: false, message: "Masih menunggu pembayaran" });
      }
    } catch (qrErr) {
      console.error(`[Sync] qr-status error for ${paymentId}:`, qrErr);
      return NextResponse.json({ status: payment.status, synced: false, message: "Gagal cek status QRIS" });
    }

    console.log(`[Sync] Payment ${paymentId} LUNAS via qr-status polling`);

    await prisma.payment.updateMany({
      where: { payment_id: paymentId, status: "MENUNGGU" },
      data: { status: "LUNAS", confirmed_at: new Date(), payment_type: "QRIS" },
    });

    await prisma.order.updateMany({
      where: { order_id: payment.order_id, status: "PENDING_PAYMENT" },
      data: { status: "PENDING" },
    });

    let orderProcessed = false;
    let orderError: string | null = null;

    try {
      await processOrderAfterPayment(payment.order_id);
      orderProcessed = true;
    } catch (err) {
      const e = err as Error;
      orderError = e.message;
      console.error(`[Sync] processOrderAfterPayment error for ${payment.order_id}:`, e);

      await prisma.order.update({
        where: { order_id: payment.order_id },
        data: {
          status: "FAILED",
          status_note: `Gagal proses otomatis: ${e.message}`.slice(0, 255),
        },
      }).catch(() => {});
    }

    return NextResponse.json({
      status: "LUNAS",
      synced: true,
      message: "Pembayaran berhasil terverifikasi",
      orderProcessed,
      orderError,
    });

  } catch (error) {
    console.error("POST /api/payments/[paymentId]/sync error:", error);
    return NextResponse.json({ error: "Gagal sync status dari GoPay" }, { status: 500 });
  }
}
