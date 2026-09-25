# logman launcher untuk Windows PowerShell. Menjalankan dev server (Vite + API Hono)
# dalam satu perintah. Lihat AGENTS.md bagian 4.
$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath $PSScriptRoot

if (-not (Get-Command pnpm -ErrorAction SilentlyContinue)) {
  Write-Error '[logman] pnpm tidak ditemukan. Install pnpm dulu.'
  exit 1
}

if (-not (Test-Path -LiteralPath 'node_modules')) {
  Write-Host '[logman] Dependencies belum terpasang, menjalankan pnpm install...'
  pnpm install
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
}

if ($args.Count -eq 0) {
  pnpm dev
} else {
  pnpm @args
}
exit $LASTEXITCODE
