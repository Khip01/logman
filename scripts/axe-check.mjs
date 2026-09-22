import AxeBuilder from '@axe-core/playwright'
import { chromium } from '@playwright/test'

/**
 * Audit aksesibilitas semua halaman pada semua tema.
 *
 * Tema dijalankan PARALEL (beberapa context pada satu browser) supaya total waktu
 * mendekati satu tema, bukan sembilan. Animasi dibekukan via CSS sehingga wait bisa
 * pendek dan hasil deterministik.
 */
const BASE = 'http://127.0.0.1:5199'
const PAGES = [
  '/',
  '/settings',
  '/export',
  '/dev/components',
  '/dev/motion',
  '/dev/perf',
  '/dev/seed',
]
const THEMES = [
  'hitam-pekat',
  'hitam-abu',
  'hitam-pastel',
  'putih-bersih',
  'putih-pastel',
  'putih-tulang',
  'putih-gdocs',
  'putih-word',
  'word-dark',
]

/**
 * Membekukan semua animasi dan transisi sebelum audit.
 *
 * Alasan: beberapa preset animasi memakai opacity (misalnya denyut idle di
 * `/dev/motion`). Bila axe mengukur saat opacity berada di tengah animasi, warna teks
 * terlihat tercampur dengan latar dan kontras terbaca lebih rendah dari keadaan akhir,
 * sehingga audit menjadi flaky. Ini masalah alat ukur, bukan warna tema. Membekukan
 * animasi membuat pengukuran deterministik dan mengukur keadaan akhir yang sebenarnya.
 *
 * Gaya ini hanya ada di dalam sesi audit, tidak pernah masuk ke aplikasi.
 */
const FREEZE_ANIMATION_CSS = `
  *, *::before, *::after {
    animation-duration: 0s !important;
    animation-delay: 0s !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0s !important;
    transition-delay: 0s !important;
  }
`

const browser = await chromium.launch()

async function auditTheme(theme) {
  const context = await browser.newContext({
    viewport: { width: 1280, height: 1400 },
    reducedMotion: 'reduce',
  })
  const page = await context.newPage()
  const findings = []

  try {
    for (const path of PAGES) {
      await page.goto(`${BASE}${path}`, { waitUntil: 'domcontentloaded' })
      await page.addStyleTag({ content: FREEZE_ANIMATION_CSS })
      await page.evaluate((t) => {
        document.documentElement.dataset.theme = t
      }, theme)
      // Animasi sudah dibekukan; wait pendek hanya untuk React commit + font.
      await page.waitForTimeout(80)
      const results = await new AxeBuilder({ page }).analyze()
      const serious = results.violations.filter(
        (v) => v.impact === 'serious' || v.impact === 'critical',
      )
      for (const v of serious) {
        findings.push({ theme, path, violation: v })
      }
    }
  } finally {
    await context.close()
  }

  return findings
}

const all = await Promise.all(THEMES.map((theme) => auditTheme(theme)))
await browser.close()

let total = 0
for (const findings of all) {
  for (const { theme, path, violation: v } of findings) {
    console.log(`[${theme}] ${path}`)
    console.log(`   [${v.impact}] ${v.id}`)
    for (const n of v.nodes.slice(0, 2)) {
      console.log('      target:', n.target.join(' '))
      for (const c of [...n.any, ...n.all]) {
        if (c.message) console.log('      msg   :', c.message.slice(0, 170))
      }
    }
    total += 1
  }
}

console.log(`TOTAL pelanggaran serious/critical: ${total}`)
process.exit(total === 0 ? 0 : 1)
