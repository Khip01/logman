#!/usr/bin/env bash
# Pintasan macOS untuk logman. Finder bisa menjalankan berkas .command dengan klik
# ganda. Lihat AGENTS.md bagian 4.
#
# Skrip ini berpindah ke akar repo (satu tingkat di atas folder packaging) lalu
# menjalankan launcher `run`.
set -euo pipefail

repo_dir="$(cd "$(dirname "$0")/.." && pwd)"
cd "$repo_dir"
exec ./run "$@"
