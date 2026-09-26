# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## v0.1.3 - 2026-09-26

### Added

- Configurable working days. Settings now has day toggles that decide which days get a
  row in the document table, so a five-day internship can drop Saturday from both the
  editor and the PDF. At least one day must stay enabled, otherwise the table would have
  no rows at all. Disabling a day only hides it: its content stays in `logs.json` and
  comes back as soon as the day is enabled again.
- Custom reasons can be marked to strip the time. Every reason now carries a flag, and a
  marked reason makes the check-in and check-out columns show a strip instead of a time.
  This is what a custom reason such as "Sakit Gigi" could never do before, because the
  strip used to be decided by matching the reason name against "Sakit" and "Izin" only.
  Reasons typed freely in the editor keep their previous behaviour.

### Changed

- Reasons are stored as an object with a label and a strip flag instead of a plain
  string. Existing configuration files are still read and migrated on load, and a
  reason called "Sakit" or "Izin" behaves exactly as before, so no manual migration is
  needed.

## v0.1.2 - 2026-09-26

### Added

- Text formatting inside the activity cell: bold (`**text**`), italic (`*text*`), and
  headings (`#`, `##`, `###`), with `Ctrl+B` and `Ctrl+I` shortcuts for the current
  selection. The cell shows the formatted result while unfocused and the plain text with
  its markers while editing, so the markers never get in the way but stay editable. The
  layout height does not change between the two modes. Content is still stored as plain
  marked-up text, so existing entries keep working and no migration is needed. The same
  parser feeds both the screen and the PDF, and all text is escaped before it becomes
  markup, so an entry such as `<script>` is printed as text.
- Screenshots in the README, regenerated with `./run screenshots`. The command fills the
  app with fictional sample data in a throwaway data directory, so it never touches a
  real Log Book. Month and week are picked explicitly instead of relying on the current
  date, which keeps the images identical whenever the command runs.

### Fixed

- The week progress badge now counts days filled with a reason (Sick, Leave, National
  Holiday, and custom reasons) as filled. It previously compared against the "filled"
  status directly, so a day filled with a reason was never counted and the badge stayed at
  zero even though the row was complete. The Export page already counted these days
  correctly, so the two views disagreed about the same data.
- The week progress badge now counts only the days that actually belong to the open month
  and fall inside the internship range. Weeks at the start or end of a month contain days
  from the neighbouring month, and weeks at the edge of the range contain days outside the
  internship. Those days cannot be filled, so a week with four fillable days now reads
  "0 of 4" instead of "0 of 6".
- The Export page summary uses the same rule, so a day is counted in exactly one month.
  It previously counted cross-month days twice and included days outside the range.

### Changed

- The campus document template is no longer tracked by git. The file stays available
  locally, and the extracted metrics remain as the reference. The template belongs to
  the campus and must not be redistributed in a public repository.
- `NOTICE` no longer claims the whole project as original work. It now claims only the
  application code, the design system, the domain logic, the tests, and the
  documentation, and it adds an explicit carve-out for the campus emblem and the
  letterhead.
- `LICENSE` gains a "Scope of this license" section stating that the license covers
  only the project code and not the emblem, the letterhead, or the institution's name.
  The license choice itself is unchanged: Apache 2.0 already requires attribution, so
  moving to GPL or AGPL would not have improved attribution.

## v0.1.0 - 2026-09-25

First release. The full core flow works end to end: fill in the profile, write daily
activities, and export a print-ready PDF.

### Added

- Application shell and design system: nine themes, centralized color tokens, manual
  motion tiers, and theme transitions built on View Transitions with a graceful fallback.
- A complete UI primitive library with variants, plus a dev gallery to review every
  component across all themes.
- Data layer with autosave, atomic writes, rotating backups, and swappable repositories
  between the HTTP runtime and an in-memory implementation for tests.
- Settings page: student profile, internship range, default hours per day, reason list,
  theme, paper size, and export folder.
- Month and week navigation with per-month row ownership. A single week can hold days from
  two different months, and rows belonging to another month are shown dimmed and read-only.
- A4 document editor with direct in-cell editing, an activity column that grows with its
  content, and keyboard navigation between cells.
- Per-month PDF export with background printing, letterhead, and a signature block.
- An in-browser print preview that matches the PDF output, driven by a single source of
  truth.
- Day completeness validation before export. Export is rejected while any day is missing
  both an activity and a reason.
- Reasons for empty days, with stripped hours for the Sick and Leave statuses.
- Visual snapshots for three product pages.
- A performance harness that measures renders per keystroke and long tasks, plus a
  measurement dashboard on the dev page.
- Per-feature error reporting with a `traceId` that can be traced down to the log file.
- Seed mode to populate sample data during development.
- The incomplete-day banner is now interactive. Selecting a day jumps to the week that
  contains it, flashes the matching row according to the active motion tier, and focuses
  the activity field so the user can type immediately.
- Each page remembers its own scroll position for the duration of the session, so
  navigating between pages no longer carries over the previous page position.
- A search box on the Settings page. Suggestions come in two layers: section titles first,
  then snippets of the text inside each section, with the matched word highlighted. The top
  suggestion is selected automatically, so pressing Enter jumps straight to that section.
- A glint effect on the section reached from the search box. A light fill grows from the
  top of the section body while a border traces around it, then both fade out together.
  The border and the fill share one gradient so their intensity matches, and the bottom
  edge of the border never lights up. The intensity follows the motion tier (full: fill
  and border, balanced: border only, minimal: a plain border, off: scroll only), and the
  colors adapt to each of the nine themes.
- The document title follows the page currently being viewed.
- Interface language switch between Indonesian and English, selectable from Settings. The
  default is Indonesian. Printed documents and exported PDFs stay in Indonesian to follow
  the campus template.
- Desktop launchers for Linux, Windows, and macOS, plus `run.cmd` and `run.ps1` for
  Windows.
- A `NOTICE` file and an attribution clause in the license.

### Changed

- Dev pages and menu only appear when enabled from Settings, and their routes redirect
  when that option is off.
- The document table follows the active theme on screen while still returning to white
  paper when printed.
- The active week highlight in the sidebar now follows the month currently in use.
  Previously a cross-month week was highlighted in both months at once.
- Selecting a week no longer collapses other expanded months in the sidebar.
- The README and CHANGELOG are written in English.
- Settings sections now share one wrapper component, so every section has a stable anchor
  and can flash briefly when reached from the search box.
- Releases no longer ship a tarball. A tag publishes a GitHub Release with generated
  notes, and the build is verified against the bundle budget.

### Fixed

- Settings search no longer leaves stale suggestions behind. Typing or deleting characters
  could keep suggestions from the previous query stuck above the new ones, because the
  React key of each suggestion was not unique.
- The divider between the quick-action icons and the month list in the collapsed sidebar
  is visible again.
- Document content on screen uses the correct size and spacing, including the gap between
  the time value and its icon.

[Unreleased]: https://github.com/Khip01/logman/compare/v0.1.3...HEAD
[v0.1.3]: https://github.com/Khip01/logman/compare/v0.1.2...v0.1.3
[v0.1.2]: https://github.com/Khip01/logman/compare/v0.1.0...v0.1.2
[v0.1.0]: https://github.com/Khip01/logman/releases/tag/v0.1.0
