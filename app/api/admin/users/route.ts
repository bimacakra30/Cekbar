
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import type { Prisma } from "@prisma/client";

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user || (user.role !== "admin" && user.role !== "superadmin")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const role = searchParams.get("role");
    const search = searchParams.get("search");

    const where: Prisma.UserWhereInput = {};

    if (role && role !== "ALL") {
      where.role = role as "user" | "reseller" | "admin" | "superadmin";
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
       ORDER BY FIELD(role, 'superadmin', 'admin', 'reseller', 'user'), created_at ASC`,
      ...params
    );

    return NextResponse.json({
      users: rows,
      total: rows.length,
    });
  } catch (error) {
    console.error("[AdminUsers] GET error");
    return NextResponse.json(
      { error: "Gagal mengambil data pengguna" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const caller = await getSessionUser(req);
    if (!caller) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (caller.role !== "admin" && caller.role !== "superadmin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { username, email, password, role, status, no_hp } = await req.json();

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

    const requestedRole = (role as string) || "user";

    if (requestedRole === "superadmin") {
      return NextResponse.json({ error: "Role superadmin tidak bisa dibuat melalui API" }, { status: 403 });
    }

    if (caller.role === "admin" && requestedRole !== "user") {
      return NextResponse.json({ error: "Admin hanya dapat menambahkan pengguna dengan role user" }, { status: 403 });
    }

    const phoneValue = no_hp || `0${Date.now().toString().slice(-11)}`;

    const existingConditions: Prisma.UserWhereInput[] = [{ email }, { username }];
    if (no_hp) {
      existingConditions.push({ no_hp });
    }

    const existing = await prisma.user.findFirst({
      where: { OR: existingConditions },
      select: { id: true, email: true, username: true },
    });

    if (existing) {
      if (existing.email === email) {
        return NextResponse.json({ error: "Email sudah terdaftar" }, { status: 409 });
      }
      if (existing.username === username) {
        return NextResponse.json({ error: "Username sudah terdaftar" }, { status: 409 });
      }
      return NextResponse.json({ error: "Nomor HP sudah terdaftar" }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const userRole = requestedRole as "user" | "reseller" | "admin";
    const userStatus = (status || "active") as "active" | "inactive";

    const newUser = await prisma.user.create({
      data: {
        nama: username,
        username,
        email,
        no_hp: phoneValue,
        password: hashedPassword,
        role: userRole,
        status: userStatus,
        email_verified: true,
      },
    });

    return NextResponse.json(
      {
        message: "Pengguna berhasil ditambahkan",
        user: { id: newUser.id, username, email, role: userRole, status: userStatus },
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error("[AdminUsers] POST error:", error);

    const errMsg = error instanceof Error ? error.message : "";
    if (errMsg.includes("Unique constraint")) {
      return NextResponse.json(
        { error: "Email, username, atau nomor HP sudah terdaftar" },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "Gagal menambahkan pengguna. Coba lagi." },
      { status: 500 }
    );
  }
}
