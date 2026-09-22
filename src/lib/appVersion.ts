/**
 * Versi aplikasi untuk ditampilkan di status bar (AGENTS.md bagian 12).
 *
 * Nilai disuntik saat build dari `version` di package.json lewat `define` di
 * vite.config.ts, sehingga tidak pernah basi. Saat dev atau test, bila nilai tidak
 * tersedia, dipakai `dev` agar UI tetap menampilkan sesuatu yang masuk akal.
 *
 * PENTING: `import.meta.env.VITE_APP_VERSION` ditulis UTUH tanpa optional chaining.
 * `define` Vite mengganti kecocokan ekspresi yang persis, sehingga
 * `import.meta.env?.VITE_APP_VERSION` TIDAK tergantikan dan diam-diam jatuh ke `dev`.
 */
export function appVersion(): string {
  const value: unknown = import.meta.env.VITE_APP_VERSION
  return typeof value === 'string' && value.trim() !== '' ? value.trim() : 'dev'
}
