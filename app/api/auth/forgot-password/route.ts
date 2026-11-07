import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import crypto from "crypto";
import { sendMail, resetPasswordEmail } from "@/lib/mailer";
import { createRateLimiter } from "@/lib/rate-limit";

const forgotLimiter = createRateLimiter({ interval: 5 * 60 * 1000, maxRequests: 2 });

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email wajib diisi" }, { status: 400 });
    }

    const rlResult = forgotLimiter.check(email.toLowerCase());
    if (!rlResult.allowed) {
      return NextResponse.json(
        { error: "Terlalu banyak permintaan. Silakan tunggu beberapa menit." },
        { status: 429 }
      );
    }

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return NextResponse.json({ message: "Jika email terdaftar, link reset password telah dikirim" });
    }

    await prisma.passwordReset.updateMany({
      where: { email, used: false },
      data: { used: true },
    });

    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await prisma.passwordReset.create({
      data: {
        email,
        token,
        expires_at: expiresAt,
      },
    });

    const baseUrl = process.env.APP_URL || `${req.nextUrl.protocol}//${req.nextUrl.host}`;
    const { subject, html } = resetPasswordEmail(token, baseUrl);

    try {
      await sendMail({ to: email, subject, html });
    } catch (err) {
      console.error("[ForgotPassword] Gagal kirim email");
      return NextResponse.json({ error: "Gagal mengirim email. Coba lagi nanti." }, { status: 500 });
    }

    return NextResponse.json({ message: "Jika email terdaftar, link reset password telah dikirim" });
  } catch (error) {
    console.error("[ForgotPassword] Error");
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 });
  }
}
