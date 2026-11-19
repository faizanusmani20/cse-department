/* CSE Notes - PWA notifications.
   Uses the Notification API + service worker to alert teachers about new
   access requests, admins about pending teachers, and students about
   approved/rejected requests. Also polls while the app is open. */

const NOTIF_PREFIX = 'cse:notif:';

function notifySupported() { return 'Notification' in window; }
function notifyGranted() { return notifySupported() && Notification.permission === 'granted'; }

/* Small button shown in the top bar. */
function notifyControl(me) {
  if (!notifySupported() || !me) return '';
  const pending = pendingCount(me);
  const badge = pending ? `<span class="nbadge">${pending}</span>` : '';
  if (Notification.permission === 'granted') return `<button class="g nbell" data-a="notif" title="Notifications are on">${BELL}${badge}</button>`;
  if (Notification.permission === 'denied') return `<button class="g nbell" data-a="notif" title="Notifications are blocked in your browser">${BELL}${badge}</button>`;
  return `<button class="g nbell" data-a="notif" title="Enable notifications">${BELL}${badge} Alerts</button>`;
}

function pendingCount(me) {
  if (!me) return 0;
  if (me.role === 'teacher') { const mine = new Set(db.notes.filter(n => n.teacher === me.id).map(n => n.id)); return db.reqs.filter(r => r.status === 'pending' && mine.has(r.note)).length; }
  if (me.role === 'admin') return db.users.filter(u => u.role === 'teacher' && u.status === 'pending').length;
  return db.reqs.filter(r => r.student === me.id && r.status === 'pending').length;
}

/* Ask the browser for permission (called from the Alerts button). */
async function requestNotifications() {
  if (!notifySupported()) { say('This browser does not support notifications.'); return; }
  if (Notification.permission === 'denied') { say('Notifications are blocked. Allow them in your browser site settings.'); return; }
  if (Notification.permission === 'granted') { say('Notifications are already on.', true); return; }
  try {
    const p = await Notification.requestPermission();
    if (p === 'granted') { await showNotification('CSE Department alerts are on', { body: 'You will be notified about new access requests and approvals.' }); say('Notifications enabled.', true); }
    else say('Notifications were not enabled.');
  } catch (err) { say('Could not enable notifications.'); }
}

/* Show a notification through the service worker when possible. */
async function showNotification(title, opts = {}) {
  if (!notifyGranted()) return;
  const options = { icon: '/icon-192.png', badge: '/icon-192.png', ...opts };
  try {
    const reg = await navigator.serviceWorker.getRegistration();
    if (reg && reg.active) { await reg.showNotification(title, options); return; }
  } catch (err) { console.warn('[notifications] service worker notification failed:', err); }
  try { new Notification(title, options); } catch (err) { console.warn('[notifications] notification failed:', err); }
}

/* ---- seen-state helpers ---- */
function readSeen(key, fallback) { try { const v = localStorage.getItem(key); return v === null ? fallback : JSON.parse(v); } catch (e) { return fallback; } }
function writeSeen(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { } }

/* Compare current data with the last snapshot and notify about changes. */
function checkNotifications() {
  if (!S.me) return;

  if (S.me.role === 'teacher') {
    const mine = new Set(db.notes.filter(n => n.teacher === S.me.id).map(n => n.id));
    const pending = db.reqs.filter(r => r.status === 'pending' && mine.has(r.note));
    const key = NOTIF_PREFIX + S.me.id + ':teacher';
    const seen = readSeen(key, null), ids = pending.map(r => r.id);
    if (seen === null) { writeSeen(key, ids); return; }
    const fresh = pending.filter(r => !seen.includes(r.id));
    if (fresh.length) {
      const first = fresh[0], note = db.notes.find(n => n.id === first.note);
      showNotification(fresh.length === 1 ? 'New access request' : fresh.length + ' new access requests', {
        body: fresh.length === 1 ? `${uname(first.student)} requested “${note ? note.title : 'a note'}”.` : `${fresh.length} students are waiting for access.`,
        tag: 'cse-requests', data: { url: '/' }
      });
    }
    writeSeen(key, ids);
    return;
  }

  if (S.me.role === 'admin') {
    const pending = db.users.filter(u => u.role === 'teacher' && u.status === 'pending');
    const key = NOTIF_PREFIX + S.me.id + ':admin';
    const seen = readSeen(key, null), ids = pending.map(u => u.id);
    if (seen === null) { writeSeen(key, ids); return; }
    const fresh = pending.filter(u => !seen.includes(u.id));
    if (fresh.length) {
      showNotification(fresh.length === 1 ? 'Teacher awaiting approval' : fresh.length + ' teachers awaiting approval', {
        body: fresh.length === 1 ? `${fresh[0].name} (${fresh[0].email}) needs approval.` : 'Open the admin panel to review them.',
        tag: 'cse-teachers', data: { url: '/' }
      });
    }
    writeSeen(key, ids);
    return;
  }

  /* Student: notify when one of their requests changes status. */
  const mine = db.reqs.filter(r => r.student === S.me.id);
  const key = NOTIF_PREFIX + S.me.id + ':student';
  const seen = readSeen(key, null), map = {};
  mine.forEach(r => map[r.id] = r.status);
  if (seen === null) { writeSeen(key, map); return; }
  const changed = mine.filter(r => seen[r.id] && seen[r.id] !== r.status && r.status !== 'pending');
  changed.forEach(r => {
    const note = db.notes.find(n => n.id === r.note);
    showNotification(r.status === 'approved' ? 'Access approved' : 'Request updated', {
      body: `${note ? '“' + note.title + '”' : 'Your request'} is now ${r.status}.`,
      tag: 'cse-request-' + r.id, data: { url: '/' }
    });
  });
  writeSeen(key, map);
}

/* Fingerprint used to decide whether the UI needs a refresh after polling. */
function notifFingerprint() {
  if (!S.me) return '';
  if (S.me.role === 'teacher') { const mine = new Set(db.notes.filter(n => n.teacher === S.me.id).map(n => n.id)); return db.reqs.filter(r => mine.has(r.note)).map(r => r.id + ':' + r.status).join(','); }
  if (S.me.role === 'admin') return db.users.filter(u => u.role === 'teacher').map(u => u.id + ':' + u.status).join(',');
  return db.reqs.filter(r => r.student === S.me.id).map(r => r.id + ':' + r.status).join(',');
}

/* Refresh data quietly; only re-render when something relevant changed. */
async function pollNotifications() {
  if (!S.me || document.hidden || !navigator.onLine) return;
  const before = notifFingerprint(), page = S.note ? currentPage() : null;
  await load();
  if (before === notifFingerprint()) return;
  render();
  if (S.note) { S.pg = page || 1; await ensureUrl(); paint(); }
}

/* Poll every minute while the tab is visible, and when it becomes visible. */
setInterval(() => { if (!document.hidden) pollNotifications(); }, 60000);
document.addEventListener('visibilitychange', () => { if (!document.hidden) pollNotifications(); });
