#!/usr/bin/env bash
# Memasang pintasan desktop Linux untuk logman. Lihat AGENTS.md bagian 4.
#
# Skrip ini menyalin template `logman.desktop` ke direktori aplikasi user, mengganti
# placeholder @REPO_DIR@ dengan lokasi repo ini, sehingga pintasan selalu menunjuk
# ke launcher `run` yang benar walau repo dipindahkan.
set -euo pipefail

repo_dir="$(cd "$(dirname "$0")/.." && pwd)"
template="$repo_dir/packaging/logman.desktop"
target_dir="${XDG_DATA_HOME:-$HOME/.local/share}/applications"
target="$target_dir/logman.desktop"

mkdir -p "$target_dir"
sed "s|@REPO_DIR@|$repo_dir|g" "$template" >"$target"
chmod +x "$target"

echo "[logman] Pintasan terpasang di $target"
echo "[logman] Jalankan lewat menu aplikasi, atau langsung: $repo_dir/run"
