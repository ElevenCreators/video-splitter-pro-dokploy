# tools/apply-download-endpoint.ps1
$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'

function Ensure-Dir { param([string]$Path) if (-not (Test-Path $Path)) { New-Item -ItemType Directory -Path $Path | Out-Null } }
function Set-FileUtf8Lf {
  param([string]$Path, [string]$Content)
  $utf8NoBom = New-Object System.Text.UTF8Encoding($false)
  $lf = ($Content -replace "`r?`n","`n")
  [System.IO.File]::WriteAllText($Path, $lf, $utf8NoBom)
}

# Detectar raiz del repo de forma confiable
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
$root = Resolve-Path (Join-Path $scriptDir "..")
if (-not (Test-Path (Join-Path $root "package.json"))) {
  # fallback: usar cwd si no encuentra package.json
  $root = Resolve-Path .
}

# Rutas destino
$apiDir = Join-Path $root "src/app/api/download"
$libDir = Join-Path $root "src/lib"
Ensure-Dir $apiDir
Ensure-Dir $libDir

# ========= 1) Endpoint /api/download =========
$routeTs = @'
// src/app/api/download/route.ts
import { NextRequest } from "next/server";
import fs from "node:fs";
import { createReadStream, promises as fsp } from "node:fs";
import path from "node:path";
import { Readable } from "node:stream";
import { ReadableStream } from "node:stream/web";
import archiver from "archiver";

export const runtime = "nodejs";

const TEMP_DIR = process.env.TEMP_DIR ?? "/app/temp";

function safeJobId(raw: string): string {
  if (!/^[a-zA-Z0-9_]+$/.test(raw)) throw new Error("jobId inválido");
  return raw;
}

async function listSegments(dir: string): Promise<string[]> {
  const items = await fsp.readdir(dir);
  return items.filter((f) => f.endsWith(".mp4")).sort();
}

export async function GET(req: NextRequest): Promise<Response> {
  const { searchParams } = new URL(req.url);
  const rawId = searchParams.get("jobId");
  if (!rawId) return new Response("Missing jobId", { status: 400 });

  const jobId = safeJobId(rawId);
  const outDir = path.join(TEMP_DIR, `output_${jobId}`);

  try {
    const files = await listSegments(outDir);
    console.log(`📦 segments(${jobId}): count=${files.length}`, files.slice(0, 5));

    if (files.length === 0) {
      return new Response("No segments found", { status: 404 });
    }

    if (files.length === 1) {
      const file = path.join(outDir, files[0]);
      const stat = await fsp.stat(file);
      const headers = new Headers({
        "Content-Type": "video/mp4",
        "Content-Length": String(stat.size),
