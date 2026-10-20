import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { sessionOptions, type SessionData } from "@/lib/session";

export async function POST(req: NextRequest) {
  const response = NextResponse.json({ message: "Logout berhasil" });
  
  const session = await getIronSession<SessionData>(req, response, sessionOptions);
  session.destroy();
  
  return response;
}
