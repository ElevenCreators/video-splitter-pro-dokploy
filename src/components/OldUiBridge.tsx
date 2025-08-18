// src/components/OldUiBridge.tsx
"use client";
import { useEffect } from "react";
import { triggerDownload } from "@/lib/triggerDownload";

/**
 * Bridge para UIs existentes:
 * - Busca un <form> (prioriza form[action*="/api/split-video"] o #split-form o [data-split-form])
 * - Lee file/seconds/mode desde inputs comunes y hace POST a /api/split-video
 * - En éxito dispara la descarga usando jobId
 *
 * No modifica tu JSX; solo añade un listener de submit.
 */
export default function OldUiBridge() {
  useEffect(() => {
    const pick = <T extends Element>(sel: string) => document.querySelector(sel) as T | null;
    const form =
      pick<HTMLFormElement>('form[action*="/api/split-video"]') ||
      pick<HTMLFormElement>('#split-form') ||
      pick<HTMLFormElement>('form[data-split-form]') ||
      pick<HTMLFormElement>('form');

    if (!form) {
      console.warn("[OldUiBridge] No se encontró <form> en la página.");
      return;
    }

    const handler = async (ev: Event) => {
      try {
        ev.preventDefault();

        // Buscar campos típicos
        const fileInput =
          (form.querySelector('input[type="file"]') as HTMLInputElement | null) ||
          (form.querySelector('input[name="file"]') as HTMLInputElement | null) ||
          (form.querySelector('input[name="video"]') as HTMLInputElement | null) ||
          (form.querySelector('input[name="upload"]') as HTMLInputElement | null);

        if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
          alert("Selecciona un archivo de video.");
          return;
        }

        // seconds
        const secInput =
          (form.querySelector('input[name="seconds"]') as HTMLInputElement | null) ||
          (form.querySelector('input[type="number"]') as HTMLInputElement | null);
        const seconds = Math.max(1, Number(secInput?.value ?? 5));

        // mode
        const modeSel =
          (form.querySelector('select[name="mode"]') as HTMLSelectElement | null) ||
          (form.querySelector('select') as HTMLSelectElement | null);
        const mode = (modeSel?.value === "copy" ? "copy" : "reencode") as "copy" | "reencode";

        // Construir FormData (IMPORTANTE: NO setear Content-Type manualmente)
        const fd = new FormData();
        fd.append("file", fileInput.files[0]);
        fd.append("seconds", String(seconds));
        fd.append("mode", mode);

        // Hacer POST a nuestro endpoint JSON
        const res = await fetch("/api/split-video", { method: "POST", body: fd });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data?.ok || !data?.jobId) {
          const msg = data?.error || `split failed (${res.status})`;
          console.error("[OldUiBridge] Error:", msg);
          alert("Error: " + msg);
          return;
        }

        // Dispara la descarga
        triggerDownload(`/api/download?jobId=${encodeURIComponent(String(data.jobId))}`);
      } catch (e) {
        console.error("[OldUiBridge] Exception", e);
        alert("Error inesperado en el procesamiento.");
      }
    };

    form.addEventListener("submit", handler);
    console.log("[OldUiBridge] attached to form:", form);

    return () => { form.removeEventListener("submit", handler); };
  }, []);

  return null;
}