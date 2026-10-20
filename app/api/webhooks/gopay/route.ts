
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyWebhookSignature } from "@/lib/gopay";
import { processOrderAfterPayment } from "@/lib/process-order";

export async function POST(req: NextRequest) {
  try {
    const payload = await req.text();
    const body = JSON.parse(payload);

    const {
      event,
      trx_id,
      amount,
      transaction,
    } = body;

    if (!event || !trx_id || !amount) {
      console.error("[GoPay Webhook] Missing required fields:", { event, trx_id, amount });
      return NextResponse.json({ status: "error", message: "Missing required fields" }, { status: 400 });
    }

    const signature = req.headers.get("x-webhook-signature") ?? "";
    const isValidSignature = verifyWebhookSignature(payload, signature);

    if (!isValidSignature) {
      console.error("[GoPay Webhook] Invalid signature for trx_id:", trx_id);
      return NextResponse.json({ status: "error", message: "Invalid signature" }, { status: 401 });
    }

    const isRetry = req.headers.get("x-webhook-retry") === "1";
    if (isRetry) {
      console.log(`[GoPay Webhook] Retry notification for trx_id: ${trx_id}`);
    }

    const payment = await prisma.payment.findFirst({
      where: { trx_id },
      select: { payment_id: true, order_id: true, total_amount: true, status: true },
    });

    if (!payment) {
      console.error(`[GoPay Webhook] Payment not found for trx_id: ${trx_id}`);
      return NextResponse.json({ status: "error", message: "Payment not found" }, { status: 404 });
    }

    if (event !== "payment.success") {
      console.log(`[GoPay Webhook] Ignoring event: ${event} for trx_id: ${trx_id}`);
      return NextResponse.json({ received: true });
    }

    console.log(`[GoPay Webhook] Payment ${payment.payment_id}: payment.success, amount: ${amount}`);

    if (payment.status !== "MENUNGGU") {
      console.log(`[GoPay Webhook] Payment ${payment.payment_id} sudah di-handle (status: ${payment.status}), skip.`);
      return NextResponse.json({ received: true, message: "Already processed" });
    }

    console.log(`[GoPay Webhook] Payment ${payment.payment_id} LUNAS via QRIS`);

    await prisma.payment.updateMany({
      where: { payment_id: payment.payment_id, status: "MENUNGGU" },
      data: {
        status: "LUNAS",
        confirmed_at: transaction?.transaction_time ? new Date(transaction.transaction_time) : new Date(),
        gopay_transaction_id: transaction?.transaction_id ?? null,
        payer_issuer: transaction?.payer_issuer ?? null,
        payment_type: transaction?.payment_type ?? "QRIS",
      },
    });

    await prisma.order.updateMany({
      where: { order_id: payment.order_id, status: "PENDING_PAYMENT" },
      data: { status: "PENDING" },
    });

    try {
      await processOrderAfterPayment(payment.order_id);
    } catch (processErr) {
      const e = processErr as Error;
      console.error(`[GoPay Webhook] processOrderAfterPayment error for ${payment.order_id}:`, e);

      await prisma.order.update({
        where: { order_id: payment.order_id },
        data: {
          status: "FAILED",
          status_note: `Gagal proses otomatis: ${e.message}`.slice(0, 255),
        },
      }).catch(() => {});
    }

    return NextResponse.json({ received: true });

  } catch (error) {
    console.error("[GoPay Webhook] Error:", error);
    return NextResponse.json({ status: "error", message: "Internal error" }, { status: 500 });
  }
}
