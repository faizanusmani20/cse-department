/* CSE Notes - offline action queue.
   Stores uploads, requests and other mutations in IndexedDB while offline and
   replays them when the browser comes back online. */

const OFFLINE_DB = 'cse-offline';
const OFFLINE_STORE = 'queue';
let offlineDbPromise = null;

function openOfflineDb() {
  if (offlineDbPromise) return offlineDbPromise;
  offlineDbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(OFFLINE_DB, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(OFFLINE_STORE)) db.createObjectStore(OFFLINE_STORE, { keyPath: 'id', autoIncrement: true });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return offlineDbPromise;
}

function offlineTx(mode, fn) {
  return openOfflineDb().then(db => new Promise((resolve, reject) => {
    const t = db.transaction(OFFLINE_STORE, mode);
    const req = fn(t.objectStore(OFFLINE_STORE));
    t.oncomplete = () => resolve(req ? req.result : undefined);
    t.onerror = () => reject(t.error);
    t.onabort = () => reject(t.error);
  }));
}

function getOfflineQueue() { return offlineTx('readonly', s => s.getAll()).catch(() => []); }
function removeOfflineAction(id) { return offlineTx('readwrite', s => s.delete(id)); }

async function refreshQueueCount() {
  try { S.queueCount = await offlineTx('readonly', s => s.count()); } catch (e) { S.queueCount = 0; }
  return S.queueCount;
}

/* Add an action to the queue. `file` is optional and stored as a Blob. */
async function queueOfflineAction(type, payload, file) {
  const item = { type, payload, userId: S.me ? S.me.id : null, createdAt: Date.now() };
  if (file) item.file = file;
  const id = await offlineTx('readwrite', s => s.add(item));
  await refreshQueueCount();
  return id;
}

/* Replay one queued action. Returns true on success. */
async function replayOfflineAction(item) {
  switch (item.type) {
    case 'upload': {
      const { path, title, subject } = item.payload;
      let r = await sb.storage.from('notes').upload(path, item.file, { contentType: 'application/pdf' });
      if (r.error) return false;
      r = await sb.from('notes').insert({ title, subject, teacher_id: S.me.id, file_path: path });
      if (r.error) { await sb.storage.from('notes').remove([path]); return false; }
      return true;
    }
    case 'savenote': {
      const { id, title, subject, path, oldPath } = item.payload;
      if (item.file) { const u = await sb.storage.from('notes').upload(path, item.file, { contentType: 'application/pdf' }); if (u.error) return false; }
      const r = await sb.from('notes').update({ title, subject, file_path: path }).eq('id', id);
      if (r.error) { if (item.file) await sb.storage.from('notes').remove([path]); return false; }
      if (item.file && oldPath) await sb.storage.from('notes').remove([oldPath]);
      return true;
    }
    case 'request': {
      const { note_id, existing } = item.payload;
      const r = existing
        ? await sb.from('requests').update({ status: 'pending' }).eq('id', existing)
        : await sb.from('requests').insert({ student_id: S.me.id, note_id });
      return !r.error || r.error.code === '23505';
    }
    case 'decide': return !(await sb.from('requests').update({ status: item.payload.status }).eq('id', item.payload.id)).error;
    case 'notepost': return !(await sb.from('notices').insert({ message: item.payload.message, created_by: S.me.id })).error;
    case 'subadd': {
      const r = await sb.from('subjects').insert({ name: item.payload.name, icon: item.payload.icon });
      return !r.error || r.error.code === '23505';
    }
    case 'tstat': return !(await sb.from('profiles').update({ status: item.payload.status }).eq('id', item.payload.id)).error;
    default: return true; /* unknown action: drop it */
  }
}

/* Replay everything queued for the current user. Stops on the first failure. */
async function flushOfflineQueue() {
  if (!navigator.onLine || !S.me) return 0;
  const items = (await getOfflineQueue()).filter(i => !i.userId || i.userId === S.me.id);
  let done = 0;
  for (const item of items) {
    try {
      const ok = await replayOfflineAction(item);
      if (!ok) break;
      await removeOfflineAction(item.id);
      done++;
    } catch (err) { console.warn('[offline] replay failed:', item.type, err); break; }
  }
  await refreshQueueCount();
  if (done) { say(done + ' queued change' + (done === 1 ? '' : 's') + ' synced.', true); await load(); render(); }
  return done;
}

/* Try to flush automatically whenever connectivity returns. */
window.addEventListener('online', async () => {
  S.offline = false;
  const done = await flushOfflineQueue();
  if (!done) { await load(); render(); }
});
window.addEventListener('offline', () => { S.offline = true; render(); });
