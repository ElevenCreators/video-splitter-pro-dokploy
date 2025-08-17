import { NextResponse } from "next/server";
import { getJob } from "@/lib/jobStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("jobId");
    if (!id) {
      return NextResponse.json({ ok: false, error: "Missing jobId" }, { status: 400 });
    }
    const job = getJob(id);
    if (!job) {
      return NextResponse.json({ ok: false, error: "Job not found" }, { status: 404 });
    }
    return NextResponse.json({ ok: true, job }, { status: 200 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
