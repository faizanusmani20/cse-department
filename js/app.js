/* CSE Notes - core rendering: top bar, view dispatch, animation, tabs. */

/* Main render entry point. Rebuilds #root from current state. */
function render() {
  if (S.loading) { $('root').innerHTML = '<div class="boot"><div class="spin"></div><div>Loading CSE Department…</div></div>'; return; }
  const me = S.recovery ? null : S.me;
  const nav = `<div class="top"><div class="bar"><div class="logo" data-a="home">${BOOK} CSE Department</div>
 ${me && me.role === 'student' ? `<input class="search" id="q" placeholder="Search notes, subjects or teachers…" value="${esc(S.q)}">` : '<div style="flex:1"></div>'}
 ${me ? `<div class="chip"><div class="av">${esc(me.name[0])}</div><span>${esc(me.name)} · ${me.role}</span>${notifyControl(me)}${window._ip ? '<button class="g" data-a="install">Install app</button>' : ''}<button class="g" data-a="logout">Log out</button></div>` : ''}</div></div>`;
  const m = S.msg ? `<div class="toast ${S.ok ? 'ok' : 'bad'}">${S.ok ? '✓' : '!'} ${esc(S.msg)}</div>` : '';
  const key = [me && me.role, S.tab, S.subject, S.note, S.mode].join('|'), an = key !== S.key; S.key = key;
  const offline = S.offline ? `<div class="offlinebar">${BELL}<span>Offline — showing saved data.${S.queueCount ? ` ${S.queueCount} change${S.queueCount === 1 ? '' : 's'} waiting to sync.` : ''}</span></div>` : '';
  $('root').innerHTML = (me ? nav : '') + offline + `<main class="${an ? 'anim' : ''}">${!me ? authView() : ({ student: studentView, teacher: teacherView, admin: adminView })[me.role]()}</main>${m}`;
  S.lastMode = S.recovery ? 'reset' : S.mode;
  if (an) {
    document.querySelectorAll('.anim .grid>*,.anim .docs>*,.anim .card').forEach((e, i) => e.style.animationDelay = Math.min(i, 14) * 45 + 'ms');
    document.querySelectorAll('.stats b').forEach(b => { const t = +b.textContent; if (!t) return; let i = 0; const s = () => { i++; b.textContent = Math.round(t * Math.min(1, i / 22)); if (i < 22) requestAnimationFrame(s); }; s(); });
  }
  if (S.msg && !S.ok && !me) { const a = document.querySelector('.fcard'); if (a) a.classList.add('shake'); }
}

/* Tab bar helper; keeps the current tab if still valid. */
function tabs(l, badge = {}) { S.tab = l.includes(S.tab) ? S.tab : l[0]; return `<div class="tabs">${l.map(t => `<button class="${t === S.tab ? 'on' : ''}" data-a="tab" data-v="${t}">${t}${badge[t] ? `<span class="n">${badge[t]}</span>` : ''}</button>`).join('')}</div>`; }
