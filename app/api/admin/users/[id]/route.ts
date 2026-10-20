
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    const caller = await getSessionUser(req);
    if (!caller) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const isSuperadmin = caller.role === "superadmin";
    const isAdmin = caller.role === "admin";

    if (!isSuperadmin && !isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const target = await prisma.user.findUnique({
      where: { id: Number(id) },
      select: { id: true, role: true },
    });

    if (!target) {
      return NextResponse.json({ error: "Pengguna tidak ditemukan" }, { status: 404 });
    }

    if (target.role === "superadmin" && caller.id !== target.id) {
      return NextResponse.json({ error: "Tidak dapat mengubah akun superadmin" }, { status: 403 });
    }

    const data: Record<string, unknown> = {};

    if (body.role !== undefined) {
      if (isAdmin) {
        return NextResponse.json({ error: "Admin tidak memiliki izin untuk mengubah role" }, { status: 403 });
      }
      if (body.role === "superadmin") {
        return NextResponse.json({ error: "Tidak dapat menetapkan role superadmin" }, { status: 403 });
      }
      data.role = body.role;
    }

    if (body.status !== undefined) {
      if (isAdmin && target.role !== "user") {
        return NextResponse.json({ error: "Admin hanya dapat mengubah status pengguna biasa" }, { status: 403 });
      }
      data.status = body.status;
    }

    if (body.username !== undefined) {
      data.username = body.username;
    }

    if (body.email !== undefined) {
      data.email = body.email;
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: "Tidak ada field yang diupdate" }, { status: 400 });
    }

    await prisma.user.update({
      where: { id: Number(id) },
      data,
    });

    return NextResponse.json({ message: "Pengguna berhasil diupdate" });
  } catch (error) {
    console.error("Update user error:", error);
    return NextResponse.json({ error: "Gagal mengupdate pengguna" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const caller = await getSessionUser(req);
    if (!caller || caller.role !== "superadmin") {
      return NextResponse.json({ error: "Hanya superadmin yang dapat menghapus pengguna" }, { status: 403 });
    }

    const target = await prisma.user.findUnique({
      where: { id: Number(id) },
      select: { id: true, role: true },
    });

    if (!target) {
      return NextResponse.json({ error: "Pengguna tidak ditemukan" }, { status: 404 });
    }
    if (target.role === "superadmin") {
      return NextResponse.json({ error: "Tidak dapat menghapus akun superadmin" }, { status: 403 });
    }

    await prisma.user.delete({ where: { id: Number(id) } });

    return NextResponse.json({ message: "Pengguna berhasil dihapus" });
  } catch (error) {
    console.error("Delete user error:", error);
    return NextResponse.json({ error: "Gagal menghapus pengguna" }, { status: 500 });
  }
}
