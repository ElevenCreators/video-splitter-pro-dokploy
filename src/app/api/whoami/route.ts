import { NextResponse } from "next/server";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET() {
  return NextResponse.json({ hostname: process.env.HOSTNAME || "unknown", pid: process.pid, now: new Date().toISOString() });
}
