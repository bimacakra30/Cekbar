import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { email, otp } = await req.json();

    if (!email || !otp) {
      return NextResponse.json({ error: "Email dan kode OTP wajib diisi" }, { status: 400 });
    }

    const record = await prisma.emailVerification.findFirst({
      where: {
        email: email.toLowerCase(),
        otp,
        used: false,
      },
      orderBy: { created_at: "desc" },
    });

    if (!record) {
      return NextResponse.json({ error: "Kode verifikasi salah" }, { status: 400 });
    }

    if (new Date() > record.expires_at) {
      return NextResponse.json({ error: "Kode verifikasi sudah kadaluarsa. Silakan kirim ulang." }, { status: 400 });
    }

    await prisma.emailVerification.update({
      where: { id: record.id },
      data: { used: true },
    });

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      return NextResponse.json({ error: "Akun tidak ditemukan" }, { status: 404 });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        email_verified: true,
        status: "active",
      },
    });

    return NextResponse.json({
      message: "Email berhasil diverifikasi! Silakan login.",
      verified: true,
    });
  } catch (error) {
    console.error("Verify OTP error:", error);
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 });
  }
}
