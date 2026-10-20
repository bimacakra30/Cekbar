
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    const data: Record<string, unknown> = {};

    if (body.service_name !== undefined) data.service_name = String(body.service_name);
    if (body.group_name !== undefined) data.group_name = String(body.group_name);
    if (body.category !== undefined) data.category = body.category === null ? null : String(body.category);
    if (body.api_provider !== undefined) data.api_provider = String(body.api_provider);
    if (body.api_service_id !== undefined) data.api_service_id = body.api_service_id === null ? null : String(body.api_service_id);
    if (body.buy_price !== undefined) data.buy_price = Number(body.buy_price);
    if (body.sell_price !== undefined) data.sell_price = Number(body.sell_price);
    if (body.time_info !== undefined) data.time_info = String(body.time_info);
    if (body.info !== undefined) data.info = String(body.info);
    if (body.is_active !== undefined) data.is_active = !!body.is_active;

    if (Object.keys(data).length === 0) {
      return NextResponse.json(
        { error: "Tidak ada field yang diupdate" },
        { status: 400 }
      );
    }

    try {
      await prisma.service.update({
        where: { id: Number(id) },
        data,
      });
    } catch (e: unknown) {
      if ((e as { code?: string })?.code === "P2025") {
        return NextResponse.json(
          { error: "Layanan tidak ditemukan" },
          { status: 404 }
        );
      }
      throw e;
    }

    return NextResponse.json({ message: "Layanan berhasil diupdate" });
  } catch (error) {
    console.error("Update service error:", error);
    return NextResponse.json(
      { error: "Gagal mengupdate layanan" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    try {
      await prisma.service.delete({ where: { id: Number(id) } });
    } catch (e: unknown) {
      if ((e as { code?: string })?.code === "P2025") {
        return NextResponse.json(
          { error: "Layanan tidak ditemukan" },
          { status: 404 }
        );
      }
      throw e;
    }

    return NextResponse.json({ message: "Layanan berhasil dihapus" });
  } catch (error) {
    console.error("Delete service error:", error);
    return NextResponse.json(
      { error: "Gagal menghapus layanan" },
      { status: 500 }
    );
  }
}
