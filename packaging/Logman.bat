@echo off
rem Pintasan Windows untuk logman. Menjalankan run.cmd di jendela terminal.
rem Lihat AGENTS.md bagian 4.
setlocal
cd /d "%~dp0.."
call run.cmd %*
