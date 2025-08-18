// src/components/VideoSplitForm.tsx
"use client";
import { useState } from "react";

type JobResponse = { ok: boolean; jobId?: string; error?: string };

export default function VideoSplitForm() {
  const [file, setFile] = useState<File | null>(null);
  const [seconds, setSeconds] = useState<number>(8);
  const [reencode, setReencode] = useState<boolean>(false);
  const [busy, setBusy] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [jobId, setJobId] = useState<string>("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!file) return;
    setBusy(true);
    setError("");
    setJobId("");
    try {
      const fd = new FormData();
      fd.append("video", file);
      fd.append("seconds", String(seconds));
      fd.append("mode", reencode ? "reencode" : "copy");
      if (reencode) fd.append("exactSegments", "1");

      const res = await fetch("/api/split-video", { method: "POST", body: fd });
      const data = (await res.json()) as JobResponse;
      if (!res.ok || !data.ok || !data.jobId) {
        throw new Error(data?.error ?? "Processing failed");
      }
      setJobId(String(data.jobId));
      // Notifica a la app (por si alguien escucha)
      window.dispatchEvent(new CustomEvent("split:job", { detail: { jobId: data.jobId } }));
      sessionStorage.setItem("split:lastJobId", String(data.jobId));
      sessionStorage.setItem("split:lastJobAt", String(Date.now()));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    setFile(f);
  }

  function onSecondsChange(e: React.ChangeEvent<HTMLInputElement>) {
    setSeconds(Number(e.target.value));
  }

  function onReencodeChange(e: React.ChangeEvent<HTMLInputElement>) {
    setReencode(e.target.checked);
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-lg space-y-3">
      <input type="file" onChange={onFileChange} accept="video/*" className="block w-full" />
      <div className="flex items-center gap-3">
        <label className="w-24 text-sm">Seconds:</label>
        <input
          type="number"
          min={1}
          max={600}
          value={seconds}
          onChange={onSecondsChange}
          className="px-3 py-2 rounded border bg-transparent w-28"
        />
      </div>
      <label className="inline-flex items-center gap-2 text-sm">
        <input type="checkbox" checked={reencode} onChange={onReencodeChange} className="accent-brand-500" />
        Re-encode exact
      </label>
      <button className="btn btn-primary" disabled={!file || busy} type="submit">
        {busy ? "Processing..." : "Start"}
      </button>
      {jobId && <div className="text-sm">Job: <code>{jobId}</code></div>}
      {error && <div className="text-red-400 text-sm">{error}</div>}
    </form>
  );
}
