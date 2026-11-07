import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionUser, verifyCsrfOrigin } from "@/lib/session";

export async function GET(req: NextRequest) {
  const sessionUser = await getSessionUser(req);
  if (!sessionUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: sessionUser.id },
    select: {
      id: true,
      nama: true,
      username: true,
      email: true,
      no_hp: true,
      role: true,
      created_at: true,
      last_login_at: true,
    },
  });

  if (!user) {
    return NextResponse.json({ error: "User tidak ditemukan" }, { status: 404 });
  }

  return NextResponse.json(user);
}

export async function PUT(req: NextRequest) {
  const sessionUser = await getSessionUser(req);
  if (!sessionUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!verifyCsrfOrigin(req)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { nama, email, no_hp } = body;

  if (!nama || !email || !no_hp) {
    return NextResponse.json({ error: "Semua field wajib diisi" }, { status: 400 });
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Format email tidak valid" }, { status: 400 });
  }

  const phoneDigits = no_hp.replace(/[\s\-()]/g, "");
  const phoneRegex = /^(\+62|62|0)[0-9]{8,13}$/;
  if (!phoneRegex.test(phoneDigits)) {
    return NextResponse.json({ error: "Format nomor HP tidak valid (contoh: 081234567890)" }, { status: 400 });
  }

  const currentUser = await prisma.user.findUnique({
    where: { id: sessionUser.id },
    select: { email: true },
  });

  if (currentUser && email.toLowerCase() !== currentUser.email.toLowerCase()) {
    return NextResponse.json(
      { error: "Perubahan email tidak diizinkan. Hubungi admin untuk mengubah email." },
      { status: 400 }
    );
  }

  const existingEmail = await prisma.user.findFirst({
    where: { email, id: { not: sessionUser.id } },
  });
  if (existingEmail) {
    return NextResponse.json({ error: "Email sudah digunakan akun lain" }, { status: 409 });
  }

  const existingPhone = await prisma.user.findFirst({
    where: { no_hp: phoneDigits, id: { not: sessionUser.id } },
  });
  if (existingPhone) {
    return NextResponse.json({ error: "Nomor HP sudah digunakan akun lain" }, { status: 409 });
  }

  const updated = await prisma.user.update({
    where: { id: sessionUser.id },
    data: { nama, email, no_hp: phoneDigits },
    select: {
      id: true,
      nama: true,
      username: true,
      email: true,
      no_hp: true,
      role: true,
    },
  });

  return NextResponse.json(updated);
}
