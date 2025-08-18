// src/components/SegmentsInline.tsx
"use client";
import { useCallback, useEffect, useState } from "react";

type DebugResp =
  | { tempDir: string; outDir: string; count: number; files: string[] }
  | { error: string };

type Props = {
  initialJobId?: string;
  autoload?: boolean;
  autoloadWindowMinutes?: number;
};

export default function SegmentsInline({
  initialJobId,
  autoload = false,
  autoloadWindowMinutes = 10,
}: Props) {
  const base = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
  const [jobId, setJobId] = useState<string>(initialJobId ?? "");
  const [files, setFiles] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  type ListResp =
  | { ok?: boolean; count?: number; files?: string[]; tempDir?: string; outDir?: string }
  | { error: string };

const refresh = useCallback(
  async (id = jobId) => {
    if (!id) return;
    setLoading(true);
    try {
      const primary = `${base}/api/list-segments?jobId=${encodeURIComponent(id)}`;
      let data: ListResp | null = null;

      // 1) Intento principal (prod)
      try {
        const r1 = await fetch(primary, { cache: "no-store" });
        if (r1.ok) data = (await r1.json()) as ListResp;
        else if (r1.status !== 404) throw new Error("list-segments failed");
      } catch {
        // ignore, vamos al fallback
      }

      // 2) Fallback (si copiaste debug-segments en este deploy)
      if (!data) {
        const r2 = await fetch(
          `${base}/api/debug-segments?jobId=${encodeURIComponent(id)}`,
          { cache: "no-store" }
        );
        if (r2.ok) data = (await r2.json()) as ListResp;
      }

      const fs = (data && "files" in data && Array.isArray((data as any).files))
        ? ((data as any).files as string[])
        : [];
      setFiles(fs);
    } catch {
      setFiles([]);
    } finally {
      setLoading(false);
    }
  },
  [jobId, base]
);
