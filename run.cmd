@echo off
rem logman launcher untuk Windows. Menjalankan dev server (Vite + API Hono) dalam
rem satu perintah. Lihat AGENTS.md bagian 4.
setlocal
cd /d "%~dp0"

where pnpm >nul 2>nul
if errorlevel 1 (
  echo [logman] pnpm tidak ditemukan. Install pnpm dulu.
  exit /b 1
)

if not exist node_modules (
  echo [logman] Dependencies belum terpasang, menjalankan pnpm install...
  call pnpm install
  if errorlevel 1 exit /b 1
)

if "%~1"=="" (
  call pnpm dev
) else (
  call pnpm %*
)
