$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue"

function Ensure-Dir { param([string]$p) if (-not (Test-Path $p)) { New-Item -ItemType Directory -Path $p | Out-Null } }
function SetUtf8Lf { param([string]$path,[string]$content)
  $enc = New-Object System.Text.UTF8Encoding($false)
  [IO.File]::WriteAllText($path, ($content -replace "`r?`n","`n"), $enc)
}

Write-Host "==> Verificando raíz..." -ForegroundColor Cyan
$root = Get-Location
if (-not (Test-Path (Join-Path $root "package.json"))) { throw "No se encontró package.json en $root" }

# ---- 1) /api/segment para descarga individual ----
Write-Host "==> 1/4 /api/segment..." -ForegroundColor Cyan
$apiSegDir = Join-Path $root "src/app/api/segment"
Ensure-Dir $apiSegDir
$apiSegPath = Join-Path $apiSegDir "route.ts"
$apiSeg = @'
// src/app/api/segment/route.ts
import { NextRequest } from "next/server";
import { TEMP_DIR } from "@/lib/paths";
import path from "node:path";
import { promises as fsp } from "node:fs";
import { Readable } from "node:stream";
import { createReadStream } from "node:fs";

export const runtime = "nodejs";

function safeJobId(raw: string | null): string {
  if (!raw) throw new Error("Missing jobId");
  if (!/^[A-Za-z0-9_-]+$/.test(raw)) throw new Error("Invalid jobId");
  return raw;
}
function safeFile(raw: string | null): string {
  if (!raw) throw new Error("Missing file");
  if (!/^segment_\d{3}\.mp4$/.test(raw)) throw new Error("Invalid file name");
  return raw;
}

export async function GET(req: NextRequest): Promise<Response> {
  try {
    const { searchParams } = new URL(req.url);
    const jobId = safeJobId(searchParams.get("jobId"));
    const file = safeFile(searchParams.get("file"));

    const outDir = path.join(TEMP_DIR, `output_${jobId}`);
    const filePath = path.join(outDir, file);
    const stat = await fsp.stat(filePath);

    const headers = new Headers({
      "Content-Type": "video/mp4",
      "Content-Length": String(stat.size),
      "Content-Disposition": `attachment; filename="${file}"`,
      "Cache-Control": "no-store",
    });

    const body = Readable.toWeb(createReadStream(filePath)) as unknown as BodyInit;
    return new Response(body, { headers });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
