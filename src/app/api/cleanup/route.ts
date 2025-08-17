import { NextResponse } from "next/server";
import { cleanOnce } from "@/lib/tempCleaner";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const token = (req.headers.get("x-admin-token") || new URL(req.url).searchParams.get("token")) ?? "";
  const required = process.env.CLEANUP_TOKEN ?? "";
  if (required && token !== required) {
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }
  const result = await cleanOnce();
  return NextResponse.json({ ok: true, ...result }, { status: 200 });
}
