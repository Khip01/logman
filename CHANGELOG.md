# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## Unreleased

### Added

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

## v0.1.0 - 2026-09-21

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

### Changed

- Dev pages and menu only appear when enabled from Settings, and their routes redirect
  when that option is off.
- The document table follows the active theme on screen while still returning to white
  paper when printed.

[Unreleased]: https://github.com/Khip01/logman/compare/v0.1.0...HEAD
[v0.1.0]: https://github.com/Khip01/logman/releases/tag/v0.1.0
