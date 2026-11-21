# CSE Notes - department notes website

Students request access to a PDF, the teacher approves, and only then can the student read it. Roles: student, teacher, admin.
Built with plain HTML, CSS and JavaScript on Supabase (login, database, private PDF storage) and hosted on Vercel.

## Files
| File | What it does |
|---|---|
| index.html | The page shell. Loads the libraries, style.css and the scripts |
| style.css | All styling, themes (water / fire), animations, mobile layout |
| js/config.js | Your Supabase Project URL and publishable key (the only file you edit) |
| js/icons.js | SVG icons, the subject list, small helpers |
| js/ | Modularised application logic (see js/README.md): state, utils, views, data, PDF compression, events |
| manifest.json, sw.js, icon-*.png | Make the site installable on a phone |
| sql/schema.sql | Run first in Supabase: tables, roles, security rules, private storage |
| sql/subjects_update.sql | Run second: admin can add, rename and delete subjects |
| sql/features_update.sql | Run third: notice board and teacher note editing |

Script order in index.html matters: Supabase, PDF.js and pdf-lib libraries, then the `js/` modules in the order documented in `js/README.md`.

## Setup
1. Supabase: create a project. In SQL Editor run sql/schema.sql, then sql/subjects_update.sql, then sql/features_update.sql (one time each).
2. Authentication > Sign In / Providers > Email: Enable email provider ON, Confirm email OFF, Minimum password length 8.
3. Put your Project URL and publishable key in config.js. Never use a key starting with sb_secret_.
4. Sign up on the site with your own email, then make yourself admin in the SQL Editor:
   update profiles set role='admin', status='active' where lower(email)=lower('you@mail.com');
5. Deploy: push this folder to a (private) GitHub repo, import it in Vercel (framework preset: Other, no build command).
6. Supabase > Authentication > URL Configuration: put your Vercel link in Site URL and Redirect URLs (needed for Forgot password).

## Notes
- The sql folder and this README are listed in .vercelignore, so they are not published.
- Students cannot download PDFs. Teachers and admin can open and download.
- The reader supports pinch / Ctrl+wheel / double-tap zoom, page navigation,
  keyboard shortcuts and a reading-progress bar. Zoom and page are remembered.
- PWA notifications: use the bell button in the top bar to enable alerts. While
  the app is open it checks for new access requests / approvals every minute.
- Offline mode: the app shell and CDN libraries are cached. The last data
  snapshot and previously opened PDFs are available offline; uploads, requests
  and other writes are queued and sync automatically when the connection returns.
- If you change app-shell files, bump `CACHE` in `sw.js` so clients update.
- PDFs are compressed in the browser before upload (pdf-lib + PDF.js). A lossless
  pass runs first; scanned files may then be rasterised to JPEG. Uploads are capped
  at 20 MB after compression (60 MB before).
- Free Supabase projects can pause after long inactivity; export your tables now and then.

## TO DO

- [x] Pdf View improve
- [x] Add slide animation in Login Page
- [ ] Fix the notification alert ev3n app is closed
- [ ] Think about new features
- [ ] convert this into react
