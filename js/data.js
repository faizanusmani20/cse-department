/* CSE Notes - data loading and PDF rendering. */

/* ---- offline snapshot of the last successful load ---- */
function snapshotKey(uid) { return 'cse:db:' + (uid || 'last'); }

function saveSnapshot(uid) {
  try {
    const json = JSON.stringify({ me: S.me, db, at: Date.now() });
    localStorage.setItem(snapshotKey(uid), json);
    localStorage.setItem(snapshotKey(null), json);
  } catch (e) { console.warn('[data] could not save offline snapshot:', e); }
}

/* Remove cached personal data on explicit logout. */
async function clearOfflineData() {
  try { localStorage.removeItem(snapshotKey(S.me ? S.me.id : null)); localStorage.removeItem(snapshotKey(null)); } catch (e) { }
  try {
    const c = await caches.open(PDF_CACHE);
    const keys = await c.keys();
    await Promise.all(keys.map(k => c.delete(k)));
  } catch (e) { }
}

function restoreSnapshot(uid) {
  try {
    const raw = localStorage.getItem(snapshotKey(uid)) || localStorage.getItem(snapshotKey(null));
    if (!raw) return false;
    const snap = JSON.parse(raw);
    if (!snap || !snap.me || !snap.db) return false;
    S.me = snap.me;
    db = snap.db;
    if (db.subjects) SUBJ = db.subjects.map(s => [s.name, ICONS[s.icon] || FILE]);
    S.offline = true;
    return true;
  } catch (e) { return false; }
}

/* Fetch the signed-in user's profile and all department data from Supabase.
   Falls back to the last saved snapshot when the network is unavailable. */
async function load() {
  let uid = null;
  try {
    const { data: { session }, error: sessionError } = await sb.auth.getSession();
    if (sessionError) throw sessionError;
    if (!session) {
      /* If the browser is offline but a previous session's snapshot exists,
         keep showing the cached app instead of bouncing to a dead login form. */
      if (!navigator.onLine && restoreSnapshot(null)) return;
      S.me = null; db = EMPTY(); S.offline = false; return;
    }
    uid = session.user.id;

    const { data: me, error: meError } = await sb.from('profiles').select('*').eq('id', uid).single();
    if (meError && !navigator.onLine) throw meError;
    if (!me || me.status !== 'active') { await sb.auth.signOut(); S.me = null; db = EMPTY(); return me ? me.status : 'none'; }
    S.me = me;

    const cols = me.role === 'admin' ? 'id,name,email,role,status' : 'id,name,role';
    const [u, n, r, sj, nt] = await Promise.all([
      sb.from('profiles').select(cols),
      sb.from('notes').select('id,title,subject,teacher_id,file_path').order('id', { ascending: false }),
      sb.from('requests').select('id,student_id,note_id,status'),
      sb.from('subjects').select('name,icon').order('pos'),
      sb.from('notices').select('id,message,created_at').order('id', { ascending: false }).limit(5)
    ]);
    const firstError = u.error || n.error || r.error || sj.error || nt.error;
    if (firstError && !navigator.onLine) throw firstError;

    if (sj.data) { SUBJ = sj.data.map(s => [s.name, ICONS[s.icon] || FILE]); if (S.subject && !SUBJ.some(s => s[0] === S.subject)) S.subject = null; }
    db = { notices: nt.data || [], subjects: sj.data || [], users: u.data || [], notes: (n.data || []).map(x => ({ ...x, teacher: x.teacher_id })), reqs: (r.data || []).map(x => ({ ...x, student: x.student_id, note: x.note_id })) };
    S.offline = false;
    saveSnapshot(uid);
    if (typeof checkNotifications === 'function') checkNotifications();
  } catch (err) {
    console.warn('[data] load failed, using offline snapshot:', err);
    if (!restoreSnapshot(uid)) { S.offline = true; if (!S.me) db = EMPTY(); }
  }
}

/* ---- offline PDF cache (Cache Storage) ---- */
const PDF_CACHE = 'cse-pdfs';
async function cachePdf(noteId, blob) {
  try { const c = await caches.open(PDF_CACHE); await c.put('/__pdf__/' + noteId, new Response(blob)); } catch (e) { }
}
async function getCachedPdf(noteId) {
  try { const c = await caches.open(PDF_CACHE); const r = await c.match('/__pdf__/' + noteId); return r ? await r.blob() : null; } catch (e) { return null; }
}

/* Download the current note's PDF into the url cache (if allowed).
   Previously opened PDFs are served from Cache Storage when offline. */
async function ensureUrl() {
  const n = db.notes.find(x => x.id === S.note); if (!n || !S.me || urls[n.id]) return;
  const priv = S.me.role === 'admin' || n.teacher === S.me.id, r = reqOf(S.me.id, n.id);
  if (!priv && !(r && r.status === 'approved')) return;
  let d = null;
  try { d = await sb.storage.from('notes').download(n.file_path); } catch (e) { d = null; }
  if (!d || d.error) {
    const cached = await getCachedPdf(n.id);
    if (cached) { urls[n.id] = cached; return; }
    say('Could not open this PDF. Access may have been revoked.');
    return;
  }
  urls[n.id] = d.data;
  cachePdf(n.id, d.data);
}

/* Render the cached PDF pages into #pages using pdf.js. */
async function paint() {
  const b = S.note && urls[S.note], box = $('pages'); if (!b || !box) return;
  try {
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    if (S.io) S.io.disconnect();
    const pdf = await pdfjsLib.getDocument({ data: await b.arrayBuffer() }).promise; box.innerHTML = '';
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5), w = Math.min(box.clientWidth - 24, 980) * (S.zoom || 1), cs = [];
    for (let i = 1; i <= pdf.numPages; i++) {
      const pg = await pdf.getPage(i), v = pg.getViewport({ scale: w / pg.getViewport({ scale: 1 }).width * dpr }), c = document.createElement('canvas');
      c.width = v.width; c.height = v.height; c.style.width = w + 'px'; c.style.height = (v.height / dpr) + 'px'; c._pg = pg; c._v = v; box.appendChild(c); cs.push(c);
    }
    const pn = $('pn'); if (pn) pn.textContent = '/ ' + cs.length;
    let saved = 1; try { saved = +localStorage.getItem('lp:' + S.me.id + ':' + S.note) || 1; } catch (e) { }
    const start = Math.min(Math.max(S.pg || saved, 1), cs.length); S.pg = 0; box.scrollTop = cs[start - 1].offsetTop - 8;
    const setP = () => {
      let p = 1; cs.forEach((x, i) => { if (x.offsetTop <= box.scrollTop + box.clientHeight / 3) p = i + 1; });
      const j = $('pj'); if (j && document.activeElement !== j) j.value = p;
      const pr = $('rpb'); if (pr) { const max = box.scrollHeight - box.clientHeight; pr.style.width = (max > 0 ? Math.min(100, Math.max(0, box.scrollTop / max * 100)) : 100) + '%'; }
      try { localStorage.setItem('lp:' + S.me.id + ':' + S.note, p); } catch (e) { }
    };
    box.onscroll = () => { clearTimeout(box._t); box._t = setTimeout(setP, 150); }; setP();
    S.io = new IntersectionObserver(es => es.forEach(en => { const c = en.target; if (en.isIntersecting && !c._d) { c._d = 1; c._pg.render({ canvasContext: c.getContext('2d'), viewport: c._v }); } }), { root: box, rootMargin: '1400px 0px' });
    cs.forEach(c => S.io.observe(c));
  } catch (e) { box.innerHTML = '<div class="empty" style="color:#fff"><div style="font-size:44px;font-weight:700">!</div><b>Could not display this PDF</b></div>'; }
}
