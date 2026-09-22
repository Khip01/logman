/// <reference types="vite/client" />

/**
 * Variabel yang disuntik saat build. Versi aplikasi berasal dari package.json lewat
 * `define` di vite.config.ts, sehingga status bar selalu menampilkan versi yang benar.
 * Interface ini digabung (declaration merging) dengan deklarasi dari vite/client.
 */
interface ImportMetaEnv {
  readonly VITE_APP_VERSION: string
}
