
import { getIronSession, type SessionOptions } from "iron-session";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export type SessionData = {
  id: number;
  nama: string;
  username: string;
  email: string;
  role: "user" | "admin" | "superadmin";
  isLoggedIn: boolean;
};

const defaultSession: SessionData = {
  id: 0,
  nama: "",
  username: "",
  email: "",
  role: "user",
  isLoggedIn: false,
};

const SESSION_SECRET = process.env.SESSION_SECRET || "bara-system-default-secret-key-change-me-in-production-32chars";

export const sessionOptions: SessionOptions = {
  password: SESSION_SECRET,
  cookieName: "bara_session",
  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  },
};

export async function getSession() {
  const cookieStore = await cookies();
  const session = await getIronSession<SessionData>(cookieStore, sessionOptions);

  if (!session.isLoggedIn) {
    Object.assign(session, defaultSession);
  }

  return session;
}

export async function getSessionFromRequest(req: NextRequest) {
  const res = NextResponse.next();
  const session = await getIronSession<SessionData>(req, res, sessionOptions);
  return { session, res };
}

export async function getSessionUser(req: NextRequest): Promise<SessionData | null> {
  try {
    const res = NextResponse.next();
    const session = await getIronSession<SessionData>(req, res, sessionOptions);
    
    if (!session.isLoggedIn || !session.id) {
      return null;
    }
    
    return {
      id: session.id,
      nama: session.nama ?? "",
      username: session.username ?? "",
      email: session.email ?? "",
      role: session.role ?? "user",
      isLoggedIn: true,
    };
  } catch {
    return null;
  }
}
