import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { sendMail, verificationOtpEmail } from "@/lib/mailer";

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email wajib diisi" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user || user.email_verified) {
      return NextResponse.json({ message: "Kode verifikasi telah dikirim jika email terdaftar" });
    }

    const lastOtp = await prisma.emailVerification.findFirst({
      where: { email: email.toLowerCase(), used: false },
      orderBy: { created_at: "desc" },
    });

    if (lastOtp && Date.now() - lastOtp.created_at.getTime() < 60000) {
      return NextResponse.json(
        { error: "Tunggu 60 detik sebelum mengirim ulang" },
        { status: 429 }
      );
    }

    await prisma.emailVerification.updateMany({
      where: { email: email.toLowerCase(), used: false },
      data: { used: true },
    });

    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await prisma.emailVerification.create({
      data: {
        email: email.toLowerCase(),
        otp,
        expires_at: expiresAt,
      },
    });

    const { subject, html } = verificationOtpEmail(otp);
    try {
      await sendMail({ to: email, subject, html });
    } catch (err) {
      console.error("[ResendOTP] Gagal kirim:", err);
      return NextResponse.json({ error: "Gagal mengirim email" }, { status: 500 });
    }

    return NextResponse.json({ message: "Kode verifikasi baru telah dikirim" });
  } catch (error) {
    console.error("Resend OTP error:", error);
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 });
  }
}
