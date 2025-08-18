param(
  [switch]$Execute,
  [switch]$PurgeNodeModules,       # opcional: borra node_modules
  [switch]$RemoveProviderFiles,    # opcional: borra netlify/railway/hostinger
  [switch]$RemoveDevPages          # opcional: borra /test-download y /api/debug-segments
)

$ErrorActionPreference = 'Stop'
$root = (Resolve-Path ".").Path

function Info($msg){ Write-Host $msg -ForegroundColor Cyan }
function Ok($msg){ Write-Host $msg -ForegroundColor Green }
function Warn($msg){ Write-Host $msg -ForegroundColor Yellow }
function DelPath([string]$p){
  if (Test-Path -LiteralPath $p){
    if ($Execute){
      Remove-Item -LiteralPath $p -Recurse -Force -ErrorAction SilentlyContinue
      Warn "  eliminado: $p"
    } else {
      Warn "  [dry-run] eliminaría: $p"
    }
  }
}

# 1) Comprobación básica de raíz
$mustHave = @("package.json","next.config.js")
foreach($f in $mustHave){
  if(-not (Test-Path (Join-Path $root $f))){
    throw "No parece la raíz del proyecto (falta $f). Ubícate en la carpeta del repo y reintenta."
  }
}
Ok "Raíz verificada: $root"

# 2) .gitignore mínimo recomendado
$gitignorePath = Join-Path $root ".gitignore"
$recommend = @(
  "# --- build & deps ---",
  ".next/",
  "node_modules/",
  "dist/",
  "coverage/",
  "types/",
  "",
  "# --- temporales runtime ---",
  "temp/",
  "app/temp/",
  "*.log",
  "*.zip",
  "",
  "# --- OS / editor ---",
  ".DS_Store",
  "Thumbs.db",
  "",
  "# --- TS / locks ---",
  "tsconfig.tsbuildinfo",
  "package-lock.json",
  "",
  "# --- env ---",
  ".env*",
  "!.env.example"
)

if (!(Test-Path $gitignorePath)) {
  if ($Execute) {
    Set-Content -Path $gitignorePath -Value ($recommend -join "`r`n") -Encoding utf8
    Ok "Creado .gitignore con patrones recomendados"
  } else {
    Warn "[dry-run] crearía .gitignore con patrones recomendados"
  }
} else {
  $current = Get-Content $gitignorePath -Raw
  $missing = $recommend | Where-Object { $current -notmatch [regex]::Escape($_) }
  if ($missing.Count -gt 0) {
    if ($Execute) {
      Add-Content -Path $gitignorePath -Value ("`r`n" + ($missing -join "`r`n"))
      Ok "Actualizado .gitignore (se añadieron patrones faltantes)"
    } else {
      Warn "[dry-run] añadiría al .gitignore:`n  " + ($missing -join "`n  ")
    }
  } else {
    Ok ".gitignore ya contiene los patrones necesarios"
  }
}

# 3) Borrado de artefactos de build / ficheros prescindibles
Info "Limpieza de artefactos de build:"
DelPath (Join-Path $root ".next")
DelPath (Join-Path $root "tsconfig.tsbuildinfo")
DelPath (Join-Path $root "estructura.txt")       # listado local que no va al repo
DelPath (Join-Path $root "package-lock.json")    # usando bun.lock, no npm lock

# 4) Opcionales
if ($PurgeNodeModules) {
  Info "Eliminando node_modules (opcional -PurgeNodeModules):"
  DelPath (Join-Path $root "node_modules")
}

if ($RemoveProviderFiles) {
  Info "Eliminando archivos de proveedores no usados (Netlify/Railway/Hostinger):"
  $providerFiles = @(
    "netlify.toml",
    "railway.toml","railway-pro-config.json",
    "RAILWAY_DEPLOY.md","RAILWAY_PRO_CHECKLIST.md","RAILWAY_PRO_DEPLOY.md",
    "HOSTINGER_MIGRATION.md","HOSTINGER_QUICKSTART.md","hostinger-setup.sh"
  )
  foreach ($pf in $providerFiles) { DelPath (Join-Path $root $pf) }
}

if ($RemoveDevPages) {
  Info "Eliminando páginas/endpoint de prueba (opcional -RemoveDevPages):"
  $testDownload = Join-Path $root "src/app/test-download"
  $debugSegments = Join-Path $root "src/app/api/debug-segments"
  DelPath $testDownload
  DelPath $debugSegments
}

Ok "Limpieza terminada."
if (-not $Execute) {
  Warn "Dry-run completado. Para ejecutar realmente, añade el switch: -Execute"
  Warn "Ejemplos:"
  Warn "  pwsh -NoProfile -ExecutionPolicy Bypass -File .\tools\cleanup-repo.ps1 -Execute"
  Warn "  pwsh -NoProfile -ExecutionPolicy Bypass -File .\tools\cleanup-repo.ps1 -Execute -RemoveProviderFiles"
  Warn "  pwsh -NoProfile -ExecutionPolicy Bypass -File .\tools\cleanup-repo.ps1 -Execute -RemoveProviderFiles -PurgeNodeModules -RemoveDevPages"
}
