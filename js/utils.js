/* CSE Notes - HTML template helpers and theme decorations (water / fire). */

/* Inline SVG eye icons used by the password field. */
const SV = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">';
const EYE = SV + '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>';
const EYEOFF = SV + '<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>';

/* Per-subject colour derived from its position in SUBJ. */
const col = s => `hsl(${(SUBJ.findIndex(x => x[0] === s) * 36 + 230) % 360} 70% 55%)`;

/* Password input wrapped with a show/hide toggle button. */
const pw = (id, ph, ac) => `<div class="pw"><input id="${id}" type="password" placeholder="${ph}" autocomplete="${ac}"><button type="button" class="eye" data-a="eye" aria-label="Show or hide password">${EYE}</button></div>`;

/* Password strength meter bar. */
const meter = '<div class="sbar"><i id="sb"></i></div>';

/* Wave path used by the water theme. */
const wave = (a, p) => { let d = 'M0 120'; for (let x = 0; x <= 2400; x += 30) d += `L${x} ${(60 + a * Math.sin(x / 1200 * Math.PI * 2 + p)).toFixed(1)}`; return d + 'L2400 120Z'; };

/* Water theme decoration markup. */
const WATER = `<div class="fx"><i class="caus"></i>${[[8, 10, 9, 0], [22, 16, 12, 2], [38, 8, 8, 4], [52, 14, 11, 1], [66, 20, 14, 3], [80, 9, 9, 5], [91, 13, 10, 2]].map(([l, s, d, dl]) => `<i class="bub" style="left:${l}%;width:${s}px;height:${s}px;--d:${d}s;animation-delay:-${dl}s"></i>`).join('')}<svg class="wv w3" viewBox="0 0 2400 120" preserveAspectRatio="none"><path d="${wave(10, 2.2)}"/></svg><svg class="wv w2" viewBox="0 0 2400 120" preserveAspectRatio="none"><path d="${wave(14, 1)}"/></svg><svg class="wv w1" viewBox="0 0 2400 120" preserveAspectRatio="none"><path d="${wave(16, 0)}"/></svg></div>`;

/* Fire theme decoration markup. */
const FIRE = `<div class="fx"><i class="glow"></i>${[[-4, 110, 230, 1.5, 0], [12, 90, 190, 1.2, .3], [27, 120, 260, 1.7, .6], [45, 100, 210, 1.3, .2], [61, 115, 250, 1.6, .9], [77, 95, 200, 1.4, .5], [91, 105, 225, 1.5, .7]].map(([l, w, hh, d, dl]) => `<i class="fl" style="left:${l}%;width:${w}px;height:${hh}px;animation-duration:${d}s;animation-delay:-${dl}s"></i>`).join('')}${[[10, 20, 6, 0], [24, -30, 8, 2], [38, 25, 7, 4], [50, -15, 9, 1], [63, 30, 6, 3], [76, -25, 8, 5], [88, 15, 7, 2], [30, 10, 9, 6]].map(([l, x, d, dl]) => `<i class="emb" style="left:${l}%;--x:${x}px;--d:${d}s;animation-delay:-${dl}s"></i>`).join('')}</div>`;

/* Notice strip shown on the student home page. */
const noticeBar = () => (db.notices || []).slice(0, 2).map(n => `<div class="notice">${BELL}<div><b>Notice</b><div>${esc(n.message)}</div><div class="mut">${new Date(n.created_at).toLocaleDateString()}</div></div></div>`).join('');

/* Subject / sort / unlock filters for the browse view. */
const filters = () => {
  const ts = [...new Set(db.notes.map(n => n.teacher))], so = S.sort || 'new';
  return `<div class="fbar"><select data-f="sort" aria-label="Sort"><option value="new" ${so === 'new' ? 'selected' : ''}>Newest first</option><option value="old" ${so === 'old' ? 'selected' : ''}>Oldest first</option><option value="az" ${so === 'az' ? 'selected' : ''}>Title A–Z</option></select><select data-f="teacher" aria-label="Teacher"><option value="">All teachers</option>${ts.map(t => `<option value="${t}" ${S.teacher === t ? 'selected' : ''}>${esc(uname(t))}</option>`).join('')}</select><label class="chk"><input type="checkbox" data-f="unl" ${S.unl ? 'checked' : ''}> Unlocked only</label></div>`;
};

/* PDF reader toolbar (zoom, page jump, reading mode). */
const tools = () => `<div class="rtools"><div class="grp"><button class="g sq" data-a="zoom" data-v="-1" aria-label="Zoom out">−</button><span id="zl">${Math.round((S.zoom || 1) * 100)}%</span><button class="g sq" data-a="zoom" data-v="1" aria-label="Zoom in">+</button></div><div class="grp"><span>Page</span><input id="pj" type="number" min="1" value="1" aria-label="Go to page"><span id="pn">/ –</span></div><button class="g" id="rmb" data-a="rm">${RMN[S.rm || 'light']}</button></div>`;
