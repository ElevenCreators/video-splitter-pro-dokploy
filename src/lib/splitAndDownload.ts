// src/lib/splitAndDownload.ts
import { triggerDownload } from "@/lib/triggerDownload";

export async function splitAndDownload(file: File, seconds: number, mode: "copy" | "reencode" = "copy") {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("seconds", String(seconds));
  fd.append("mode", mode);

  const res = await fetch("/api/split-video", { method: "POST", body: fd });
  if (!res.ok) throw new Error("split-video failed");
  const data = await res.json() as { ok: boolean; jobId: string };
  if (!data?.ok || !data?.jobId) throw new Error("missing jobId");
  triggerDownload(`/api/download?jobId=${encodeURIComponent(data.jobId)}`);
  return data.jobId;
}