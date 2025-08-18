// src/components/DownloadButton.tsx
"use client";
import { triggerDownload } from "@/lib/triggerDownload";

type Props = {
  jobId: string | null | undefined;
  className?: string;
  label?: string;
};

export default function DownloadButton({ jobId, className, label }: Props) {
  const disabled = !jobId;
  return (
    <button
      type="button"
      disabled={disabled}
      aria-disabled={disabled}
      onClick={() => {
        if (jobId) {
          triggerDownload(`/api/download?jobId=${encodeURIComponent(jobId)}`);
        }
      }}
      className={className ?? "px-3 py-2 rounded-xl bg-black text-white disabled:opacity-50"}
    >
      {label ?? "Descargar clips"}
    </button>
  );
}