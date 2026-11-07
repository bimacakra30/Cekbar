
import { getIronSession, type SessionOptions } from "iron-session";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export type SessionData = {
  id: number;
  nama: string;
  username: string;
  email: string;
  role: "user" | "reseller" | "admin" | "superadmin";
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

if (!process.env.SESSION_SECRET) {
  throw new Error("SESSION_SECRET environment variable is required. Set it in .env file.");
}

export const sessionOptions: SessionOptions = {
  password: process.env.SESSION_SECRET,
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

/**
 * Require admin/superadmin session. Returns session data or a 401/403 response.
 */
export async function requireAdmin(req: NextRequest): Promise<SessionData | NextResponse> {
  const user = await getSessionUser(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (user.role !== "admin" && user.role !== "superadmin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return user;
}

export function verifyCsrfOrigin(req: NextRequest): boolean {
  const origin = req.headers.get("origin");
  const referer = req.headers.get("referer");
  const host = req.headers.get("host");
  
  if (!host) return false;
  
  if (origin) {
    try {
      const originHost = new URL(origin).host;
      return originHost === host;
    } catch {
      return false;
    }
  }
  
  if (referer) {
    try {
      const refererHost = new URL(referer).host;
      return refererHost === host;
    } catch {
      return false;
    }
  }
  
  return false;
}
