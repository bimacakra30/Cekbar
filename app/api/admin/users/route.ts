
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import type { Prisma } from "@prisma/client";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const role = searchParams.get("role");
    const search = searchParams.get("search");

    const where: Prisma.UserWhereInput = {};

    if (role && role !== "ALL") {
      where.role = role as "user" | "admin" | "superadmin";
    }

    if (search) {
      where.OR = [
        { username: { contains: search } },
        { email: { contains: search } },
      ];
    }

    const conditions: string[] = [];
    const params: unknown[] = [];

    if (role && role !== "ALL") {
      conditions.push("role = ?");
      params.push(role);
    }
    if (search) {
      conditions.push("(username LIKE ? OR email LIKE ?)");
      params.push(`%${search}%`, `%${search}%`);
    }

    const whereClause = conditions.length > 0 ? "WHERE " + conditions.join(" AND ") : "";

    const rows = await prisma.$queryRawUnsafe<Record<string, unknown>[]>(
      `SELECT id, nama, username, email, no_hp, role, status, last_login_at, created_at, updated_at
       FROM users ${whereClause}
       ORDER BY FIELD(role, 'superadmin', 'admin', 'user'), created_at ASC`,
      ...params
    );

    return NextResponse.json({
      users: rows,
      total: rows.length,
    });
  } catch (error) {
    console.error("Get users error:", error);
    return NextResponse.json(
      { error: "Gagal mengambil data pengguna" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { username, email, password, role, status } = await req.json();

    if (!username || !email || !password) {
      return NextResponse.json(
        { error: "Username, email, dan password wajib diisi" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password minimal 6 karakter" },
        { status: 400 }
      );
    }

    const existing = await prisma.user.findFirst({
      where: { OR: [{ email }, { username }] },
      select: { id: true },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Email atau username sudah terdaftar" },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const caller = await getSessionUser(req);
    if (!caller) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const requestedRole = (role as string) || "user";

    if (requestedRole === "superadmin") {
      return NextResponse.json({ error: "Role superadmin tidak bisa dibuat melalui API" }, { status: 403 });
    }

    if (caller.role === "admin" && requestedRole !== "user") {
      return NextResponse.json({ error: "Admin hanya dapat menambahkan pengguna dengan role user" }, { status: 403 });
    }

    const userRole = requestedRole as "user" | "admin";
    const userStatus = (status || "active") as "active" | "inactive";

    const newUser = await prisma.user.create({
      data: {
        nama: username,
        username,
        email,
        no_hp: "",
        password: hashedPassword,
        role: userRole,
        status: userStatus,
      },
    });

    return NextResponse.json(
      {
        message: "Pengguna berhasil ditambahkan",
        user: { id: newUser.id, username, email, role: userRole, status: userStatus },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create user error:", error);
    return NextResponse.json(
      { error: "Gagal menambahkan pengguna" },
      { status: 500 }
    );
  }
}
