import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionUser, verifyCsrfOrigin } from "@/lib/session";

const VALID_TRANSITIONS: Record<string, string[]> = {
  PENDING: ["PROCESSING", "FAILED"],
  PROCESSING: ["SUCCESS", "FAILED"],
};

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const user = await getSessionUser(req);
    if (!user || (user.role !== "admin" && user.role !== "superadmin")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!verifyCsrfOrigin(req)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { orderId } = await params;
    const body = await req.json();
    const { action, admin_note } = body as { action: string; admin_note?: string };

    if (!action) {
      return NextResponse.json({ error: "Action wajib diisi" }, { status: 400 });
    }

    const order = await prisma.order.findUnique({
      where: { order_id: orderId },
      select: {
        order_id: true,
        status: true,
        is_manual_order: true,
        admin_note: true,
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order tidak ditemukan" }, { status: 404 });
    }

    if (!order.is_manual_order) {
      return NextResponse.json(
        { error: "Order ini bukan order manual" },
        { status: 400 }
      );
    }

    const targetStatus = action.toUpperCase();
    const allowed = VALID_TRANSITIONS[order.status] ?? [];

    if (!allowed.includes(targetStatus)) {
      return NextResponse.json(
        { error: `Tidak bisa ubah status dari ${order.status} ke ${targetStatus}` },
        { status: 400 }
      );
    }

    const updateData: Record<string, unknown> = {
      status: targetStatus,
    };

    if (admin_note !== undefined) {
      updateData.admin_note = admin_note;
    }

    if (targetStatus === "PROCESSING") {
      updateData.processed_by = user.id;
      updateData.processed_at = new Date();
      updateData.status_note = "Sedang diproses oleh admin";
    }

    if (targetStatus === "SUCCESS") {
      updateData.completed_at = new Date();
      updateData.status_note = admin_note || "Pesanan selesai diproses";
    }

    if (targetStatus === "FAILED") {
      updateData.completed_at = new Date();
      updateData.status_note = admin_note || "Pesanan gagal diproses";
    }

    await prisma.order.update({
      where: { order_id: orderId },
      data: updateData,
    });

    return NextResponse.json({ success: true, status: targetStatus });
  } catch (error) {
    console.error("PATCH /api/admin/orders/[orderId]/process error:", error);
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 });
  }
}

