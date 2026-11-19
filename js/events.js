/* CSE Notes - event wiring and application bootstrap. */

/* Single delegated click handler for the whole app. */
document.addEventListener('click', async e => {
  const el = e.target.closest('[data-a]'); if (!el || el.disabled) return;
  const a = el.dataset.a, rid = el.dataset.id, id = +rid, v = el.dataset.v;
  say(''); if ($('e')) S.em = $('e').value; if ($('n')) S.nm = $('n').value;
  if (['login', 'signup', 'sendreset', 'setpw', 'request'].includes(a)) { el.disabled = true; el.innerHTML = '<span class="spin s"></span> Please wait'; }
  let sync = false;
  if (a === 'mode') S.mode = S.mode === 'login' ? 'signup' : 'login';
  else if (a === 'login') {
    const r = await sb.auth.signInWithPassword({ email: $('e').value.trim(), password: $('p').value });
    if (r.error) say(r.error.message === 'Invalid login credentials' ? 'Wrong email or password.' : r.error.message);
    else { const bad = await load(); if (bad === 'pending') say('Your teacher account is waiting for admin approval.'); else if (bad) say('Your account is not active. Contact the admin.'); else { S.tab = ''; S.subject = null; S.note = null; S.q = ''; } }
  } else if (a === 'signup') {
    const n = $('n').value.trim(), em = $('e').value.trim(), p = $('p').value, ro = $('r').value;
    if (!n || !em || p.length < 8) say('Enter name, email and a password of 8+ characters.');
    else { const r = await sb.auth.signUp({ email: em, password: p, options: { data: { name: n, role: ro } } }); if (!E(r)) { await sb.auth.signOut(); S.mode = 'login'; say(ro === 'teacher' ? 'Account created. Wait for admin approval.' : 'Account created. Log in now.', true); } }
  } else if (a === 'eye') { const i = el.parentElement.querySelector('input'); i.type = i.type === 'password' ? 'text' : 'password'; el.innerHTML = i.type === 'password' ? EYE : EYEOFF; return; }
  else if (a === 'dl') {
    const n = db.notes.find(x => x.id === id); if (n) { el.disabled = true; const d = await sb.storage.from('notes').download(n.file_path); if (!E(d)) { const u = URL.createObjectURL(d.data), k = document.createElement('a'); k.href = u; k.download = (n.title.replace(/[^\w\- ]+/g, '').trim() || 'note') + '.pdf'; document.body.appendChild(k); k.click(); k.remove(); setTimeout(() => URL.revokeObjectURL(u), 5000); say('Download started.', true); } }
  } else if (a === 'subadd') {
    const nm = $('sn').value.trim(), ic = $('si').value;
    if (nm.length < 2) say('Enter a subject name (at least 2 letters).');
    else { const r = await sb.from('subjects').insert({ name: nm, icon: ic }); if (r.error) say(r.error.code === '23505' ? 'A subject with this name already exists.' : r.error.message); else { say('Subject added.', true); sync = true; } }
  } else if (a === 'subren') {
    const t = (prompt('Rename subject', v) || '').trim(); if (!t || t === v) return;
    const r = await sb.from('subjects').update({ name: t }).eq('name', v);
    if (r.error) say(r.error.code === '23505' ? 'A subject with this name already exists.' : r.error.message); else { if (S.subject === v) S.subject = t; say('Subject renamed. Its notes moved with it.', true); sync = true; }
  } else if (a === 'subdel') {
    if (db.notes.some(n => n.subject === v)) say('This subject still has notes. Delete or move them first.');
    else { if (!confirm('Delete the subject "' + v + '"?')) return; E(await sb.from('subjects').delete().eq('name', v)); sync = true; }
  } else if (a === 'install') { if (window._ip) { window._ip.prompt(); window._ip = null; } }
  else if (a === 'notif') { await requestNotifications(); render(); return; }
  else if (a === 'zoom') { setZoom((S.zoom || 1) + (+v) * .25); return; }
  else if (a === 'zoomreset') { setZoom(1); return; }
  else if (a === 'page') { goToPage(currentPage() + (+v)); return; }
  else if (a === 'rm') {
    const m = ['light', 'sepia', 'dark']; S.rm = m[(m.indexOf(S.rm || 'light') + 1) % 3]; try { localStorage.setItem('rm', S.rm); } catch (e) { }
    $('pg').className = 'pg rm-' + S.rm; el.textContent = RMN[S.rm]; return;
  } else if (a === 'notepost') {
    const m = $('nm').value.trim(); if (m.length < 3) say('Write a short notice first.');
    else { const r = await sb.from('notices').insert({ message: m, created_by: S.me.id }); if (!E(r)) { say('Notice posted.', true); sync = true; } }
  } else if (a === 'notedel') { E(await sb.from('notices').delete().eq('id', id)); sync = true; }
  else if (a === 'editnote') S.edit = id;
  else if (a === 'canceledit') S.edit = null;
  else if (a === 'savenote') {
    const n = db.notes.find(x => x.id === id), t = $('et').value.trim(), sj = $('es').value, f = $('ef').files[0];
    if (!t) say('The title cannot be empty.'); else if (f && f.type !== 'application/pdf') say('Only PDF files are allowed.'); else if (f && f.size > 60 * 1024 * 1024) say('PDF must be under 60 MB.');
    else {
      el.disabled = true; let path = n.file_path, uploadFile = f, savedPct = 0;
      if (f) {
        el.textContent = 'Compressing…';
        const res = await safeCompressPdf(f, p => { el.textContent = 'Compressing… ' + Math.round(p * 100) + '%'; });
        uploadFile = res.file; savedPct = res.saved;
        if (uploadFile.size > 20 * 1024 * 1024) { say('Compressed PDF is still over 20 MB. Try a smaller file.'); el.disabled = false; el.textContent = 'Save changes'; return; }
        path = `${S.me.id}/${crypto.randomUUID()}.pdf`;
      }
      el.textContent = 'Saving…';
      if (f) { const u = await sb.storage.from('notes').upload(path, uploadFile, { contentType: 'application/pdf' }); if (E(u)) { render(); return; } }
      const r = await sb.from('notes').update({ title: t, subject: sj, file_path: path }).eq('id', id);
      if (E(r)) { if (f) await sb.storage.from('notes').remove([path]); }
      else { if (f) await sb.storage.from('notes').remove([n.file_path]); delete urls[id]; S.edit = null; say('Note updated.' + (savedPct > 0.02 ? ` PDF compressed by ${Math.round(savedPct * 100)}%.` : ''), true); sync = true; }
    }
  } else if (a === 'forgot') S.mode = 'forgot';
  else if (a === 'sendreset') {
    const em = $('e').value.trim();
    if (!em) say('Enter your email.');
    else { const r = await sb.auth.resetPasswordForEmail(em, { redirectTo: location.origin + location.pathname }); if (!E(r)) { S.mode = 'login'; say('If this email is registered, a reset link is on its way. Check your inbox and spam folder.', true); } }
  } else if (a === 'setpw') {
    const p = $('p').value, p2 = $('p2').value;
    if (p.length < 8) say('Password must be 8 or more characters.'); else if (p !== p2) say('The two passwords do not match.');
    else { const r = await sb.auth.updateUser({ password: p }); if (!E(r)) { await sb.auth.signOut(); S.recovery = false; S.mode = 'login'; history.replaceState(null, '', location.pathname); say('Password changed. Log in with your new password.', true); } }
  } else if (a === 'logout') { S.edit = null; dropUrls(); await sb.auth.signOut(); S.me = null; db = EMPTY(); S.note = null; S.subject = null; S.q = ''; }
  else if (a === 'home') { S.subject = null; S.note = null; S.q = ''; S.tab = 'Browse'; }
  else if (a === 'subject') { S.subject = v; S.note = null; S.tab = 'Browse'; }
  else if (a === 'note') S.note = id;
  else if (a === 'back') S.note = null;
  else if (a === 'tab') { S.tab = v; S.note = null; S.edit = null; }
  else if (a === 'full') { const p = document.querySelector('.reader'); if (p && p.requestFullscreen) p.requestFullscreen(); return; }
  else if (a === 'request') {
    const old = reqOf(S.me.id, id);
    const r = old ? await sb.from('requests').update({ status: 'pending' }).eq('id', old.id) : await sb.from('requests').insert({ student_id: S.me.id, note_id: id });
    if (!E(r)) say('Request sent to the teacher.', true); sync = true;
  } else if (a === 'decide') { E(await sb.from('requests').update({ status: v }).eq('id', id)); sync = true; }
  else if (a === 'tstat') { E(await sb.from('profiles').update({ status: v }).eq('id', rid)); sync = true; }
  else if (a === 'deluser') {
    if (!confirm('Delete this user and all their notes? This cannot be undone.')) return;
    const paths = db.notes.filter(n => n.teacher === rid).map(n => n.file_path);
    if (paths.length) await sb.storage.from('notes').remove(paths);
    E(await sb.rpc('admin_delete_user', { uid: rid })); sync = true;
  } else if (a === 'delnote') {
    if (!confirm('Delete this note permanently?')) return;
    const n = db.notes.find(x => x.id === id); if (n) { await sb.storage.from('notes').remove([n.file_path]); E(await sb.from('notes').delete().eq('id', id)); } sync = true;
  } else if (a === 'upload') {
    const f = $('f').files[0], t = $('t').value.trim();
    if (!t || !f) say('Add a title and choose a PDF.'); else if (f.type !== 'application/pdf') say('Only PDF files are allowed.');
    else if (f.size > 60 * 1024 * 1024) say('PDF must be under 60 MB.');
    else {
      el.disabled = true; el.textContent = 'Compressing…';
      const res = await safeCompressPdf(f, p => { el.textContent = 'Compressing… ' + Math.round(p * 100) + '%'; });
      const uploadFile = res.file;
      if (uploadFile.size > 20 * 1024 * 1024) { say('Compressed PDF is still over 20 MB. Try a smaller file.'); el.disabled = false; el.textContent = 'Upload'; return; }
      el.textContent = 'Uploading…'; const path = `${S.me.id}/${crypto.randomUUID()}.pdf`;
      let r = await sb.storage.from('notes').upload(path, uploadFile, { contentType: 'application/pdf' });
      if (!E(r)) { r = await sb.from('notes').insert({ title: t, subject: $('s').value, teacher_id: S.me.id, file_path: path }); if (E(r)) await sb.storage.from('notes').remove([path]); else { S.tab = 'My notes'; say('Note uploaded.' + (res.saved > 0.02 ? ` PDF compressed by ${Math.round(res.saved * 100)}% (${formatBytes(res.originalSize)} → ${formatBytes(res.size)}).` : ''), true); sync = true; } }
    }
  }
  if (sync) await load();
  if (!S.note) dropUrls(); else await ensureUrl();
  render(); window.scrollTo(0, 0); paint();
});

/* Live search input. */
document.addEventListener('input', e => {
  if (e.target.id === 'q') { S.q = e.target.value; S.note = null; const r = $('res'); if (r) r.innerHTML = results(); else { render(); const q = $('q'); q.focus(); q.setSelectionRange(q.value.length, q.value.length); } }
});

/* Password-recovery redirect handling. */
sb.auth.onAuthStateChange(ev => { if (ev === 'PASSWORD_RECOVERY') { S.recovery = true; S.mode = 'reset'; render(); } });
if (location.hash.includes('otp_expired')) say('This reset link has expired. Please request a new one.');

/* Enter key submits the focused auth form. */
document.addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.closest && e.target.closest('.fcard')) { const b = document.querySelector('.fcard .big'); if (b) b.click(); } });

/* Password strength meter. */
document.addEventListener('input', e => {
  if (e.target.id === 'p' && $('sb')) {
    const v = e.target.value; let s = 0; if (v.length >= 8) s++; if (/[A-Z]/.test(v) && /[a-z]/.test(v)) s++; if (/\d/.test(v)) s++; if (/[^A-Za-z0-9]/.test(v) || v.length >= 12) s++;
    $('sb').style.width = s * 25 + '%'; $('sb').style.background = ['#dc2626', '#dc2626', '#d97706', '#16a34a', '#16a34a'][s];
  }
});

/* File picker label update. */
document.addEventListener('change', e => { if (e.target.id === 'f') { const f = e.target.files[0]; $('fn').textContent = f ? f.name + ' (' + (f.size / 1048576).toFixed(1) + ' MB)' : 'Click or drop a PDF here'; } });

/* Drag-and-drop upload zone. */
['dragover', 'dragleave', 'drop'].forEach(t => document.addEventListener(t, e => {
  const dz = e.target.closest && e.target.closest('#dz'); if (!dz) return; e.preventDefault();
  if (t === 'drop') { const i = $('f'); i.files = e.dataTransfer.files; i.dispatchEvent(new Event('change', { bubbles: true })); }
  dz.classList.toggle('over', t === 'dragover');
}));

/* Subject icon change. */
document.addEventListener('change', async e => {
  if (e.target.classList && e.target.classList.contains('isel')) { const r = await sb.from('subjects').update({ icon: e.target.value }).eq('name', e.target.dataset.s); if (!E(r)) say('Icon updated.', true); await load(); render(); }
});

/* Restore reading-mode preference. */
try { S.rm = localStorage.getItem('rm') || 'light'; } catch (e) { S.rm = 'light'; }

/* Service worker for offline/installable app. */
if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(() => { });

/* Install prompt handling. */
window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); window._ip = e; if (S.me && !S.loading) render(); });

/* Filter changes and page-jump input. */
document.addEventListener('change', e => {
  const f = e.target.dataset && e.target.dataset.f;
  if (f) { S[f] = f === 'unl' ? e.target.checked : e.target.value; const r = $('res'); if (r) r.innerHTML = results(); }
  if (e.target.id === 'pj') { const box = $('pages'), cs = box ? box.querySelectorAll('canvas') : []; if (cs.length) { const p = Math.min(Math.max(+e.target.value || 1, 1), cs.length); box.scrollTop = cs[p - 1].offsetTop - 8; } }
});
document.addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.id === 'pj') e.target.dispatchEvent(new Event('change', { bubbles: true })); });

/* Disable right-click on the PDF reader (protects content). */
document.addEventListener('contextmenu', e => { if (e.target.closest && e.target.closest('.pg')) e.preventDefault(); });

/* Global error reporter. */
window.addEventListener('unhandledrejection', e => { say('Something went wrong: ' + ((e.reason && e.reason.message) || e.reason)); render(); });

/* Bootstrap: show loading, fetch data, then render. */
S.loading = true; render();
(async () => { await load(); S.loading = false; render(); })();
