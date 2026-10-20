import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { sessionOptions, type SessionData } from "@/lib/session";
import { getIronSession } from "iron-session";

export async function POST(req: NextRequest) {
  try {
    const { login, password } = await req.json();

    if (!login || !password) {
      return NextResponse.json(
        { error: "Login dan password wajib diisi" },
        { status: 400 }
      );
    }

    const loginVal = String(login).trim();

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { username: loginVal },
          { email: loginVal.toLowerCase() },
        ],
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Akun tidak ditemukan atau password salah" },
        { status: 401 }
      );
    }

    if (user.status === "inactive") {
      if (!user.email_verified) {
        return NextResponse.json(
          { error: "Email belum diverifikasi. Silakan cek inbox email Anda.", needVerification: true, email: user.email },
          { status: 403 }
        );
      }
      return NextResponse.json(
        { error: "Akun Anda telah dinonaktifkan. Hubungi admin." },
        { status: 403 }
      );
    }

    const valid = await bcrypt.compare(password, user.password);

    if (!valid) {
      return NextResponse.json(
        { error: "Akun tidak ditemukan atau password salah" },
        { status: 401 }
      );
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { last_login_at: new Date() },
    });

    const response = NextResponse.json({
      message: "Login berhasil",
      user: {
        id: user.id,
        nama: user.nama,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });

    const session = await getIronSession<SessionData>(req, response, sessionOptions);
    session.id = user.id;
    session.nama = user.nama;
    session.username = user.username;
    session.email = user.email;
    session.role = user.role;
    session.isLoggedIn = true;
    await session.save();

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}
