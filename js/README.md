# JavaScript modules (`js/`)

The client logic lives entirely in this folder. Scripts are loaded by `index.html`
in the order listed below — each file depends on the globals created by the
ones above it, so **do not reorder** the `<script>` tags without checking the
dependency list.

## Load order

| # | File | Responsibility | Depends on |
|---|------|----------------|------------|
| 1 | `config.js` | Supabase project URL and publishable key (`SB_URL`, `SB_KEY`). **The only file you should edit to connect a different project.** | — |
| 2 | `icons.js` | SVG icon strings, the subject list (`SUBJ0`/`SUBJ`), icon keys and the small UI helpers. | `config.js` (none really, but loaded first) |
| 3 | `state.js` | Supabase client (`sb`), in-memory database cache (`db`), UI state (`S`), and shared helpers (`$`, `esc`, `uname`, `emo`, `reqOf`, `say`, `urls`, `E`, `EMPTY`). | `config.js`, `icons.js` |
| 4 | `utils.js` | HTML template helpers and theme decorations: `EYE`/`EYEOFF`, `col`, `pw`, `meter`, `wave`, `WATER`, `FIRE`, `noticeBar`, `filters`, `tools`. | `state.js`, `icons.js` |
| 5 | `app.js` | Core rendering: `render()` (top bar + view dispatch + animations) and `tabs()`. | `state.js`, `utils.js`, `views.js`* |
| 6 | `views.js` | Screen templates: `authView`, `studentView`, `teacherView`, `adminView`, `reader`, `docCard`, `results`. | `state.js`, `utils.js`, `icons.js` |
| 7 | `data.js` | Supabase data access: `load()`, `ensureUrl()`, `paint()` (PDF.js rendering). | `state.js` |
| 8 | `pdf-compress.js` | Client-side PDF compression before upload (`safeCompressPdf`, `compressPdf`, `rasterizePdf`). | `pdf-lib`, `pdf.js` |
| 9 | `events.js` | All event listeners (click, input, change, drag/drop, …) and application bootstrap. | everything above |

\*`app.js` is loaded before `views.js` but only calls `authView`/`studentView`/etc. at runtime (inside `render()`), by which point `views.js` has loaded. Keep `app.js` above `views.js` only if you preserve this lazy-call pattern.

## Shared globals

Everything communicates through a small set of globals defined in `state.js`:

- `sb` — Supabase client.
- `db` — cached tables: `{ users, notes, reqs, subjects, notices }`.
- `S` — UI state: `{ me, mode, tab, subject, note, q, msg, ok, loading, … }`.
- `$` — `document.getElementById` shortcut.
- `esc` — HTML escaper used by every template.

## Conventions

- Templates are plain template-literal strings returned from view functions; they are
  injected via `innerHTML`. Always escape untrusted values with `esc()`.
- User actions go through the single delegated `click` listener in `events.js`,
  keyed by the `data-a` attribute on the clicked element.
- After a mutating action, set `sync = true` so `load()` refreshes `db`, then
  `render()` redraws. See `events.js`.
- PDF blobs are cached in `urls` (see `data.js`) and released by `dropUrls()`.
- Uploads run through `safeCompressPdf()` first. It tries a lossless pdf-lib
  optimisation, then a lossy page-rasterisation pass for scanned documents.
  If compression would grow the file, the original is uploaded unchanged.

## Adding a new feature

1. Add any new state field to `S` in `state.js`.
2. Add a view (or extend one) in `views.js`.
3. Add data access in `data.js` if new tables/queries are needed.
4. Wire the action in the `click` handler in `events.js` (set `sync = true`).
5. Update this README.
