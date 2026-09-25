# logman

An internship Log Book generator. A local web app for writing daily internship
activities, editing them in place like a document, and exporting a print-ready PDF
that is ready to sign.

## Requirements

- Node.js 20 or newer
- pnpm 9 or newer
- Chromium for PDF export (installed automatically by Playwright)

## Getting started

```bash
./run
```

The command installs dependencies when needed, then starts the web app and the API
together.

- Web: http://127.0.0.1:5199
- API: http://127.0.0.1:5198

Other tasks use the same entry point:

```bash
./run build       # typecheck + production build
./run lint        # lint and format check (Biome)
./run typecheck   # TypeScript type check
./run test        # unit tests (Vitest: domain + components + server)
./run test:e2e    # end-to-end tests (Playwright, needs Chromium)
./run analyze     # build + bundle budget check
```

Focused scripts for faster debugging:

```bash
./run test:domain        # domain logic only
./run test:server        # server only
./run test:e2e:editor    # a single e2e spec, for example editor
./run audit:motion       # animation rules
./run audit:a11y         # accessibility across every page and theme
```

`./run <argument>` forwards to the `pnpm` script of the same name, so
`./run test:e2e:seed` and `./run test:e2e:perf` work as well.

## Pages

- `/` Log Book: month and week navigation, in-place per-cell editing, per-week
  signatory names (student, supervising lecturer, field supervisor), and a content
  display scale.
- `/settings` Settings: profile, internship period, default hours (including a 12 or
  24 hour clock), field supervisor list, empty-day reasons, theme, paper size,
  document font (Times New Roman or Arial), content scale, export folder via a native
  folder dialog, motion tier, interface language, and the dev UI toggle. A search box at
  the top matches both section names and the text inside each section, highlights the
  matched word, and jumps to the section you pick.
- `/export` Monthly PDF export. Export is refused while any day is incomplete, meaning
  it has neither an activity nor a reason.
- `/dev/components`, `/dev/motion`, `/dev/perf`, `/dev/seed`: development pages for
  testing and measurement. The menu and these pages are reachable only when "Show Dev
  menu" is enabled in Settings (off by default).

## Language

The interface ships in Indonesian and English. Switch it under Settings, then
Language. The default is Indonesian, and the choice is stored in the configuration.

Printed documents and exported PDFs always stay in Indonesian. The letterhead, table
headers, day and month names, and signature block follow the campus template, so they
are deliberately not translated.

## Data

Runtime data is stored locally and is not tracked by git:

- `data/config.json`: profile, internship period, default hours, time format,
  document font, content scale, field supervisor list, reasons, theme, paper size,
  motion tier, interface language, dev UI toggle.
- `data/logs.json`: daily activity entries and per-week signatory names.
- `data/backups/`: rotating backup taken before a write.
- `data/logs/`: application logs as JSON lines with a `traceId`.
- `data/exports/`: generated PDFs when `folderExport` is empty.

## Documentation

Every rule, design decision, and convention lives in [AGENTS.md](./AGENTS.md). Read it
before changing anything. Current progress is tracked in section 20 of that document.

## Releases

Releases are cut from git tags. The workflow builds the production bundle and verifies
the bundle budget, then publishes a GitHub Release with auto-generated notes. Desktop
shortcuts are provided under `packaging/` for users who prefer a launcher over the
terminal.

## License

Apache License 2.0. See [LICENSE](./LICENSE) and [NOTICE](./NOTICE).
