/* CSE Notes - shared application state and tiny helpers.
   Loaded after config.js and icons.js. Everything else reads from these globals. */

/* Supabase client, built from config.js values. */
const sb = supabase.createClient(SB_URL, SB_KEY);

/* In-memory database cache: profiles, notes, requests (+ subjects/notices). */
let db = { users: [], notes: [], reqs: [] };

/* UI state: current user, view mode, open subject/note, filters, messages. */
const S = { me: null, mode: 'login', tab: '', subject: null, note: null, q: '', msg: '', ok: false };

/* DOM shortcut. */
const $ = id => document.getElementById(id);

/* HTML-escape untrusted text before injecting into templates. */
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

/* Look up a user's display name by id. */
const uname = id => (db.users.find(u => u.id === id) || { name: '?' }).name;

/* Subject icon for a subject name. */
const emo = s => (SUBJ.find(x => x[0] === s) || [0, FILE])[1];

/* Find the access request for a (student, note) pair. */
const reqOf = (sid, nid) => db.reqs.find(r => r.student === sid && r.note === nid);

/* Set a transient toast message. */
const say = (m, ok) => { S.msg = m; S.ok = !!ok; };

/* Cached PDF blobs keyed by note id. */
const urls = {};
const dropUrls = () => { for (const k in urls) delete urls[k]; };

/* Supabase response helper: surfaces errors as a toast and returns true on error. */
const E = r => { if (r && r.error) { say(r.error.message || 'Something went wrong. Try again.'); return true; } return false; };

/* Empty database shape used on logout / when no session. */
const EMPTY = () => ({ users: [], notes: [], reqs: [] });
