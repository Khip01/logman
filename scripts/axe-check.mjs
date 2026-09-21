import AxeBuilder from '@axe-core/playwright'
import { chromium } from '@playwright/test'

/** Audit aksesibilitas semua halaman pada semua tema. */
const BASE = 'http://127.0.0.1:5199'
const PAGES = ['/', '/settings', '/dev/components', '/dev/motion', '/dev/perf']
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

const browser = await chromium.launch()
let total = 0

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

for (const theme of THEMES) {
  const context = await browser.newContext({
    viewport: { width: 1280, height: 1400 },
    reducedMotion: 'reduce',
  })
  const page = await context.newPage()
  for (const path of PAGES) {
    await page.goto(`${BASE}${path}`)
    await page.addStyleTag({ content: FREEZE_ANIMATION_CSS })
    await page.evaluate((t) => {
      document.documentElement.dataset.theme = t
    }, theme)
    await page.waitForTimeout(350)
    const results = await new AxeBuilder({ page }).analyze()
    const serious = results.violations.filter(
      (v) => v.impact === 'serious' || v.impact === 'critical',
    )
    if (serious.length > 0) {
      console.log(`[${theme}] ${path}`)
      for (const v of serious) {
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
  }
  await context.close()
}

console.log(`TOTAL pelanggaran serious/critical: ${total}`)
await browser.close()
process.exit(total === 0 ? 0 : 1)
