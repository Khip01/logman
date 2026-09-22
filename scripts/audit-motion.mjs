#!/usr/bin/env node
/**
 * Audit animasi (AGENTS.md bagian 8.2, 8.3, dan 13).
 * Menolak pola yang dilarang:
 *  1. Animasi properti pemicu layout (width, height, top, left, right, bottom,
 *     margin, padding, borderWidth, fontSize) di dalam prop animate/initial/exit/while*.
 *  2. Impor Motion global (`motion` dari 'motion/react') alih-alih `m`.
 *  3. `transition-all` Tailwind atau `transition: all` CSS.
 *  4. Selector `*` dengan transition.
 *  5. Prop `layout` Motion di luar sidebar. Satu-satunya pengecualian yang disetujui
 *     ada di src/components/shared/Sidebar.tsx (bagian 8.3.2).
 */
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { extname, join } from 'node:path'

const ROOTS = ['src', 'dev']
const EXTS = new Set(['.ts', '.tsx', '.css'])
const IGNORE_DIRS = new Set(['node_modules', 'dist', '.git'])

/** Satu-satunya file yang boleh memakai prop `layout` Motion (AGENTS.md bagian 8.3.2). */
const LAYOUT_ALLOWLIST = ['src/components/shared/Sidebar.tsx']

const FORBIDDEN_ANIMATED = [
  'width',
  'height',
  'top',
  'left',
  'right',
  'bottom',
  'margin',
  'marginTop',
  'marginLeft',
  'marginRight',
  'marginBottom',
  'padding',
  'paddingTop',
  'paddingLeft',
  'paddingRight',
  'paddingBottom',
  'borderWidth',
  'fontSize',
]

const violations = []

function walk(dir) {
  for (const entry of readdirSync(dir)) {
    if (IGNORE_DIRS.has(entry)) continue
    const full = join(dir, entry)
    const info = statSync(full)
    if (info.isDirectory()) {
      walk(full)
    } else if (EXTS.has(extname(entry))) {
      inspect(full)
    }
  }
}

function stripComments(source) {
  // Blok komentar diganti spasi (newline dipertahankan agar nomor baris tetap).
  const withoutBlocks = source.replace(/\/\*[\s\S]*?\*\//g, (match) => match.replace(/[^\n]/g, ' '))
  // Komentar baris, hindari memotong URL (yang mengandung "://").
  return withoutBlocks.replace(/(^|[^:])\/\/[^\n]*/g, '$1')
}

function inspect(file) {
  const source = stripComments(readFileSync(file, 'utf8'))
  const lines = source.split('\n')

  lines.forEach((line, index) => {
    const lineNo = index + 1

    if (/\btransition-all\b/.test(line)) {
      violations.push({ file, lineNo, rule: 'transition-all', text: line.trim() })
    }

    if (/transition\s*:\s*all/.test(line)) {
      violations.push({ file, lineNo, rule: 'transition: all', text: line.trim() })
    }

    if (/^\s*\*[^{]*\{[^}]*transition/.test(line)) {
      violations.push({ file, lineNo, rule: 'transition pada selector *', text: line.trim() })
    }

    // Impor Motion global. Yang benar adalah `m` dari 'motion/react'.
    const importMatch = line.match(/import\s*\{([^}]*)\}\s*from\s*['"]motion\/react['"]/)
    if (importMatch) {
      const names = importMatch[1]
        .split(',')
        .map((n) => n.trim())
        .filter(Boolean)
      if (names.includes('motion')) {
        violations.push({
          file,
          lineNo,
          rule: "impor Motion global (pakai 'm' + LazyMotion)",
          text: line.trim(),
        })
      }
    }

    // Prop `layout` Motion hanya boleh di sidebar (AGENTS.md bagian 8.3.2).
    if (!LAYOUT_ALLOWLIST.includes(file.replace(/\\/g, '/')) && /[\s<]layout\s*[=>/]/.test(line)) {
      violations.push({
        file,
        lineNo,
        rule: 'prop `layout` Motion di luar pengecualian sidebar',
        text: line.trim(),
      })
    }

    // Properti terlarang di dalam prop animasi.
    if (/(animate|initial|exit|whileHover|whileTap|whileInView|variants)\s*[=:]/.test(line)) {
      for (const prop of FORBIDDEN_ANIMATED) {
        const pattern = new RegExp(`\\b${prop}\\s*:`)
        if (pattern.test(line)) {
          violations.push({
            file,
            lineNo,
            rule: `animasi properti terlarang: ${prop}`,
            text: line.trim(),
          })
        }
      }
    }
  })
}

for (const root of ROOTS) {
  try {
    walk(root)
  } catch {
    // Folder opsional, abaikan bila belum ada.
  }
}

if (violations.length === 0) {
  console.log('[audit-motion] OK: tidak ada pelanggaran aturan animasi.')
  process.exit(0)
}

console.error(`[audit-motion] GAGAL: ${violations.length} pelanggaran ditemukan.`)
for (const v of violations) {
  console.error(`  ${v.file}:${v.lineNo}  [${v.rule}]  ${v.text}`)
}
process.exit(1)
