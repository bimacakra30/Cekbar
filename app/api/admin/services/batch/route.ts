
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json() as { ids: number[]; is_active: boolean };

    if (!Array.isArray(body.ids) || body.ids.length === 0) {
      return NextResponse.json(
        { error: "ids harus berupa array dan tidak boleh kosong" },
        { status: 400 }
      );
    }

    if (typeof body.is_active !== "boolean") {
      return NextResponse.json(
        { error: "is_active harus boolean" },
        { status: 400 }
      );
    }

    const result = await prisma.service.updateMany({
      where: { id: { in: body.ids } },
      data: { is_active: body.is_active },
    });

    return NextResponse.json({
      ok: true,
      affectedRows: result.count,
    });
  } catch (error) {
    console.error("Batch update error:", error);
    return NextResponse.json(
      { error: "Gagal update batch layanan" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json() as { ids: number[] };

    if (!Array.isArray(body.ids) || body.ids.length === 0) {
      return NextResponse.json(
        { error: "ids harus berupa array dan tidak boleh kosong" },
        { status: 400 }
      );
    }

    const result = await prisma.service.deleteMany({
      where: { id: { in: body.ids } },
    });

    return NextResponse.json({
      ok: true,
      affectedRows: result.count,
    });
  } catch (error) {
    console.error("Batch delete error:", error);
    return NextResponse.json(
      { error: "Gagal menghapus batch layanan" },
      { status: 500 }
    );
  }
}
