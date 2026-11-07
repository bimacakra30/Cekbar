import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { createRateLimiter } from "@/lib/rate-limit";

const verifyLimiter = createRateLimiter({ interval: 15 * 60 * 1000, maxRequests: 5 });

export async function POST(req: NextRequest) {
  try {
    const { email, otp } = await req.json();

    if (!email || !otp) {
      return NextResponse.json({ error: "Email dan kode OTP wajib diisi" }, { status: 400 });
    }

    const rlResult = verifyLimiter.check(email.toLowerCase());
    if (!rlResult.allowed) {
      return NextResponse.json(
        { error: "Terlalu banyak percobaan. Silakan tunggu 15 menit." },
        { status: 429 }
      );
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
      verifyLimiter.check(email.toLowerCase());
      return NextResponse.json({ error: "Kode verifikasi salah" }, { status: 400 });
    }

    if (new Date() > record.expires_at) {
      return NextResponse.json({ error: "Kode verifikasi sudah kadaluarsa. Silakan kirim ulang." }, { status: 400 });
    }

    await prisma.$transaction([
      prisma.emailVerification.update({
        where: { id: record.id },
        data: { used: true },
      }),
      prisma.user.update({
        where: { email: email.toLowerCase() },
        data: {
          email_verified: true,
          status: "active",
        },
      }),
    ]);

    return NextResponse.json({
      message: "Email berhasil diverifikasi! Silakan login.",
      verified: true,
    });
  } catch (error) {
    console.error("[VerifyOTP] Error");
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 });
  }
}
