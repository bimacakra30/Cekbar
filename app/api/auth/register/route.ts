import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { sendMail, verificationOtpEmail } from "@/lib/mailer";

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const nama: string = (body.nama ?? "").trim();
    const username: string = (body.username ?? "").trim();
    const email: string = (body.email ?? "").trim().toLowerCase();
    const no_hp: string = (body.no_hp ?? "").trim();
    const password: string = body.password ?? "";

    if (!nama || !username || !email || !no_hp || !password) {
      return NextResponse.json(
        { error: "Semua field wajib diisi" },
        { status: 400 }
      );
    }

    if (nama.length < 2) {
      return NextResponse.json(
        { error: "Nama minimal 2 karakter" },
        { status: 400 }
      );
    }

    if (username.length < 3) {
      return NextResponse.json(
        { error: "Username minimal 3 karakter" },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Format email tidak valid" },
        { status: 400 }
      );
    }

    const phoneDigits = no_hp.replace(/[\s\-()]/g, "");
    const phoneRegex = /^(\+62|62|0)[0-9]{8,13}$/;
    if (!phoneRegex.test(phoneDigits)) {
      return NextResponse.json(
        { error: "Format nomor HP tidak valid (contoh: 081234567890)" },
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
      where: {
        OR: [
          { email, email_verified: true },
          { username },
          { no_hp: phoneDigits, email_verified: true },
        ],
      },
      select: { id: true },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Email, username, atau nomor HP sudah terdaftar" },
        { status: 409 }
      );
    }

    await prisma.user.deleteMany({
      where: { email, email_verified: false },
    });

    const hashedPassword = await bcrypt.hash(password, 12);

    await prisma.user.create({
      data: {
        nama,
        username,
        email,
        no_hp: phoneDigits,
        password: hashedPassword,
        role: "user",
        status: "inactive",
        email_verified: false,
      },
    });

    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await prisma.emailVerification.updateMany({
      where: { email, used: false },
      data: { used: true },
    });

    await prisma.emailVerification.create({
      data: {
        email,
        otp,
        expires_at: expiresAt,
      },
    });

    const { subject, html } = verificationOtpEmail(otp);
    try {
      await sendMail({ to: email, subject, html });
    } catch (err) {
      console.error("[Register] Gagal kirim OTP email:", err);
      return NextResponse.json(
        { error: "Gagal mengirim kode verifikasi ke email. Coba lagi." },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        message: "Kode verifikasi telah dikirim ke email Anda",
        requireVerification: true,
        email,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}
