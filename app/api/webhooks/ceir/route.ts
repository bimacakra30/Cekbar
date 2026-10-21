
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import prisma from "@/lib/prisma";

const STATUS_MAP: Record<string, string> = {
  pending: "PENDING",
  processing: "PROCESSING",
  success: "SUCCESS",
  failed: "FAILED",
};

const NOTE_MAP: Record<string, string> = {
  pending: "Menunggu proses...",
  processing: "Pesanan sedang diproses...",
  success: "Add Roamer berhasil",
  failed: "Add Roamer gagal. Hubungi admin untuk pemeriksaan refund.",
};

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();

    const webhookSecret = process.env.CEIRID_WEBHOOK_SECRET ?? "";
    const signature = req.headers.get("x-ceirid-hmac-signature") ?? "";

    if (!webhookSecret) {
      console.error("[CEIR Webhook] CEIRID_WEBHOOK_SECRET tidak dikonfigurasi");
      return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
    }

    const expected = crypto
      .createHmac("sha256", webhookSecret)
      .update(rawBody)
      .digest("hex");

    const isValid =
      signature.length === expected.length &&
      crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));

    if (!isValid) {
      console.error("[CEIR Webhook] Invalid HMAC signature");
      console.error("[CEIR Webhook] Received sig :", signature);
      console.error("[CEIR Webhook] Expected sig :", expected);
      console.error("[CEIR Webhook] Raw body len  :", rawBody.length);
      console.error("[CEIR Webhook] Secret len    :", webhookSecret.length);
      console.error("[CEIR Webhook] Raw body first 200:", rawBody.substring(0, 200));
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const payload = JSON.parse(rawBody);
    const { event, data } = payload;

    console.log(`[CEIR Webhook] Event: ${event}, order_id: ${data?.order_id}, status: ${data?.status}`);

    if (event !== "roamer_order_status_changed") {
      console.log(`[CEIR Webhook] Ignoring event: ${event}`);
      return NextResponse.json({ ok: true });
    }

    if (!data || data.order_id == null || !data.status) {
      console.error("[CEIR Webhook] Missing data.order_id or data.status");
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Webhook uji dari CEIRID — order_id: 0 bukan order asli, langsung balas OK
    if (data.order_id === 0 || data.order_id === "0") {
      console.log("[CEIR Webhook] Test webhook received, acknowledged");
      return NextResponse.json({ ok: true, message: "Test acknowledged" });
    }

    const dbStatus = STATUS_MAP[data.status] ?? "PROCESSING";
    const statusNote = NOTE_MAP[data.status] ?? data.status;

    let resultData = null;
    if (data.result) {
      try {
        resultData = typeof data.result === "string" ? JSON.parse(data.result) : data.result;
      } catch {
        resultData = data.result;
      }
    }

    const webhookOrderId = String(data.order_id);
    const numericId = data.numeric_id ? String(data.numeric_id) : null;

    let existingOrder = await prisma.order.findFirst({
      where: { ceir_order_id: webhookOrderId },
      select: { order_id: true, status: true, ceir_order_id: true },
    });

    if (!existingOrder) {
      existingOrder = await prisma.order.findFirst({
        where: { ceir_order_id: { endsWith: `-${webhookOrderId}` } },
        select: { order_id: true, status: true, ceir_order_id: true },
      });
    }

    if (!existingOrder && numericId) {
      existingOrder = await prisma.order.findFirst({
        where: { ceir_order_id: { endsWith: `-${numericId}` } },
        select: { order_id: true, status: true, ceir_order_id: true },
      });
    }

    if (!existingOrder) {
      console.error(`[CEIR Webhook] Order not found for ceir_order_id suffix: ${data.order_id}`);
      return NextResponse.json({ ok: true, message: "Order not found but acknowledged" });
    }

    if (existingOrder.status === "SUCCESS" || existingOrder.status === "FAILED") {
      console.log(`[CEIR Webhook] Order ${existingOrder.order_id} sudah ${existingOrder.status}, skip update`);
      return NextResponse.json({ ok: true, message: "Already processed" });
    }

    await prisma.order.update({
      where: { order_id: existingOrder.order_id },
      data: {
        status: dbStatus as "PENDING" | "PROCESSING" | "SUCCESS" | "FAILED",
        status_note: statusNote,
        results: resultData ? {
          ceir_order_id: existingOrder.ceir_order_id,
          service_id: data.service_id,
          imei: data.imei,
          result: resultData,
          charged_amount: data.charged_amount,
          refunded_amount: data.refunded_amount,
        } : undefined,
        completed_at: data.status === "success" ? new Date() : undefined,
      },
    });

    if (data.refunded_amount && data.refunded_amount > 0) {
      console.log(`[CEIR Webhook] ⚠️ Refund detected for order ${existingOrder.order_id}: Rp ${data.refunded_amount}`);
    }

    console.log(`[CEIR Webhook] Order ${existingOrder.order_id} updated: ${dbStatus} — ${statusNote}`);

    return NextResponse.json({ ok: true });

  } catch (error) {
    console.error("[CEIR Webhook] Error:", error);
    return NextResponse.json({ ok: true, error: "Internal error" });
  }
}
