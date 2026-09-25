' Pintasan Windows tanpa jendela konsol untuk logman.
'
' Menjalankan run.cmd secara tersembunyi, sehingga hanya server yang berjalan dan
' jendela terminal tidak ikut muncul. Lihat AGENTS.md bagian 4.
Option Explicit

Dim shell, fso, repoDir, command
Set shell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")

' Lokasi skrip ini: <repo>\packaging, jadi repo adalah satu tingkat di atasnya.
repoDir = fso.GetParentFolderName(fso.GetParentFolderName(WScript.ScriptFullName))

shell.CurrentDirectory = repoDir
command = "cmd /c """ & repoDir & "\run.cmd"""
shell.Run command, 0, False
