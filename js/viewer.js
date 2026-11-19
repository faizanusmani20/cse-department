/* CSE Notes - PDF viewer gestures and keyboard shortcuts.
   Adds pinch-to-zoom, Ctrl/Cmd + wheel zoom, double-tap zoom, page navigation
   and keyboard shortcuts on top of the existing toolbar buttons. */

const VIEWER_MIN_ZOOM = 0.6, VIEWER_MAX_ZOOM = 3;

function viewerOpen() { return !!(S.note && $('pages')); }
function viewerCanvases() { const box = $('pages'); return box ? [...box.querySelectorAll('canvas')] : []; }

/* Page currently in view (same heuristic used by data.js). */
function currentPage() {
  const box = $('pages'), cs = viewerCanvases(); if (!box || !cs.length) return 1;
  let p = 1; cs.forEach((x, i) => { if (x.offsetTop <= box.scrollTop + box.clientHeight / 3) p = i + 1; });
  return p;
}

function goToPage(p) {
  const box = $('pages'), cs = viewerCanvases(); if (!box || !cs.length) return;
  p = Math.min(Math.max(Math.round(p) || 1, 1), cs.length);
  box.scrollTop = cs[p - 1].offsetTop - 8;
  const j = $('pj'); if (j) j.value = p;
  try { localStorage.setItem('lp:' + S.me.id + ':' + S.note, p); } catch (e) { }
}

function updateZoomLabel() { const z = $('zl'); if (z) z.textContent = Math.round((S.zoom || 1) * 100) + '%'; }

/* Commit a new zoom level and repaint. */
function setZoom(z) {
  if (!viewerOpen()) return;
  S.zoom = Math.min(VIEWER_MAX_ZOOM, Math.max(VIEWER_MIN_ZOOM, z));
  updateZoomLabel();
  try { localStorage.setItem('rz', S.zoom); } catch (e) { }
  S.pg = currentPage();
  paint();
}

function zoomBy(d) { setZoom((S.zoom || 1) + d); }

/* Live zoom while a gesture is in progress; repaint is debounced. */
let paintTimer = null;
function schedulePaint() {
  clearTimeout(paintTimer);
  paintTimer = setTimeout(() => { if (viewerOpen()) { S.pg = currentPage(); paint(); } }, 140);
}

/* Restore the last zoom level. */
try { const z = +localStorage.getItem('rz'); if (z >= VIEWER_MIN_ZOOM && z <= VIEWER_MAX_ZOOM) S.zoom = z; } catch (e) { }

/* ---- pinch to zoom (touch) ---- */
let pinch = null, lastTap = 0, lastTapX = 0, lastTapY = 0;

document.addEventListener('touchstart', e => {
  if (!viewerOpen() || e.touches.length !== 2 || !e.target.closest('#pages')) return;
  const [a, b] = e.touches;
  pinch = { dist: Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY), zoom: S.zoom || 1, page: currentPage() };
  clearTimeout(paintTimer);
  e.preventDefault();
}, { passive: false });

document.addEventListener('touchmove', e => {
  if (!pinch || e.touches.length !== 2) return;
  const [a, b] = e.touches;
  const d = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
  if (!pinch.dist) return;
  S.zoom = Math.min(VIEWER_MAX_ZOOM, Math.max(VIEWER_MIN_ZOOM, pinch.zoom * d / pinch.dist));
  updateZoomLabel();
  try { localStorage.setItem('rz', S.zoom); } catch (err) { }
  e.preventDefault();
  schedulePaint();
}, { passive: false });

document.addEventListener('touchend', e => {
  if (pinch) {
    if (e.touches.length === 0) {
      const p = pinch.page; pinch = null; lastTap = 0;
      clearTimeout(paintTimer); S.pg = p; paint();
    }
    return;
  }
  /* Double-tap toggles between fit (1x) and 2x. */
  if (e.changedTouches.length === 1 && viewerOpen() && e.target.closest('#pages') && e.touches.length === 0) {
    const t = e.changedTouches[0], now = Date.now();
    if (now - lastTap < 320 && Math.hypot(t.clientX - lastTapX, t.clientY - lastTapY) < 30) {
      lastTap = 0; setZoom((S.zoom || 1) > 1.4 ? 1 : 2); return;
    }
    lastTap = now; lastTapX = t.clientX; lastTapY = t.clientY;
  }
}, { passive: true });

/* ---- Ctrl/Cmd + wheel to zoom (desktop) ---- */
document.addEventListener('wheel', e => {
  if (!viewerOpen() || !e.target.closest('#pages') || !(e.ctrlKey || e.metaKey)) return;
  e.preventDefault();
  S.zoom = Math.min(VIEWER_MAX_ZOOM, Math.max(VIEWER_MIN_ZOOM, (S.zoom || 1) + (e.deltaY < 0 ? .2 : -.2)));
  updateZoomLabel();
  try { localStorage.setItem('rz', S.zoom); } catch (err) { }
  schedulePaint();
}, { passive: false });

/* ---- keyboard shortcuts ---- */
document.addEventListener('keydown', e => {
  if (!viewerOpen()) return;
  const t = e.target;
  if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable)) return;
  const k = e.key;
  if (k === '+' || k === '=') { e.preventDefault(); zoomBy(.25); }
  else if (k === '-' || k === '_') { e.preventDefault(); zoomBy(-.25); }
  else if (k === '0') { e.preventDefault(); setZoom(1); }
  else if (k === 'ArrowLeft' || k === 'PageUp') { e.preventDefault(); goToPage(currentPage() - 1); }
  else if (k === 'ArrowRight' || k === 'PageDown') { e.preventDefault(); goToPage(currentPage() + 1); }
  else if (k === 'Home') { e.preventDefault(); goToPage(1); }
  else if (k === 'End') { e.preventDefault(); goToPage(viewerCanvases().length || 1); }
  else if (k === 'f' || k === 'F') {
    const p = document.querySelector('.reader');
    if (p) { if (document.fullscreenElement) document.exitFullscreen(); else if (p.requestFullscreen) p.requestFullscreen(); }
  }
});
