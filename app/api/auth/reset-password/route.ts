import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  const { token, password, confirmPassword } = await req.json();

  if (!token || !password || !confirmPassword) {
    return NextResponse.json({ error: "Semua field wajib diisi" }, { status: 400 });
  }

  if (password.length < 6) {
    return NextResponse.json({ error: "Password minimal 6 karakter" }, { status: 400 });
  }

  if (password !== confirmPassword) {
    return NextResponse.json({ error: "Konfirmasi password tidak cocok" }, { status: 400 });
  }

  const resetRecord = await prisma.passwordReset.findUnique({ where: { token } });

  if (!resetRecord) {
    return NextResponse.json({ error: "Token tidak valid" }, { status: 400 });
  }

  if (resetRecord.used) {
    return NextResponse.json({ error: "Token sudah digunakan" }, { status: 400 });
  }

  if (new Date() > resetRecord.expires_at) {
    return NextResponse.json({ error: "Token sudah kadaluarsa. Silakan minta reset password ulang." }, { status: 400 });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  await prisma.user.update({
    where: { email: resetRecord.email },
    data: { password: hashedPassword },
  });

  await prisma.passwordReset.update({
    where: { id: resetRecord.id },
    data: { used: true },
  });

  return NextResponse.json({ message: "Password berhasil direset. Silakan login dengan password baru." });
}
