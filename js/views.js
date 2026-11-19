/* CSE Notes - view templates for auth, student, teacher and admin screens. */

function authView() {
  const m = S.mode, E_ = esc(S.em || ''), N_ = esc(S.nm || '');
  const T = { login: ['Welcome back', 'Log in to read the notes your teachers have shared.'], signup: ['Join your department', 'Create an account and request notes subject by subject.'], forgot: ['No worries', 'We’ll email you a link to reset your password.'], reset: ['Almost done', 'Choose a new password for your account.'] }[m] || [];
  const F = {
    login: `<h2>Log in</h2><p class="mut">Use your email and password.</p>
  <label>Email<input id="e" type="email" value="${E_}" placeholder="you@college.edu" autocomplete="email"></label>
  <label>Password${pw('p', 'Your password', 'current-password')}</label>
  <div class="r"><button class="lnk" data-a="forgot">Forgot password?</button></div>
  <button class="big full" data-a="login">Log in</button>
  <div class="sw">New here? <button class="lnk" data-a="mode">Create an account</button></div>`,
    signup: `<h2>Create account</h2><p class="mut">It takes less than a minute.</p>
  <label>Full name<input id="n" value="${N_}" placeholder="Your name" autocomplete="name"></label>
  <label>I am a<select id="r"><option value="student">Student</option><option value="teacher">Teacher (needs admin approval)</option></select></label>
  <label>Email<input id="e" type="email" value="${E_}" placeholder="you@college.edu" autocomplete="email"></label>
  <label>Password${pw('p', '8+ characters', 'new-password')}</label>${meter}
  <button class="big full" style="margin-top:14px" data-a="signup">Create account</button>
  <div class="sw">Already registered? <button class="lnk" data-a="mode">Log in</button></div>`,
    forgot: `<h2>Forgot password?</h2><p class="mut">Enter your email and we’ll send a reset link.</p>
  <label>Email<input id="e" type="email" value="${E_}" placeholder="you@college.edu"></label>
  <button class="big full" style="margin-top:14px" data-a="sendreset">Send reset link</button>
  <div class="sw"><button class="lnk" data-a="mode">← Back to log in</button></div>`,
    reset: `<h2>New password</h2><p class="mut">Use 8 or more characters.</p>
  <label>New password${pw('p', 'New password', 'new-password')}</label>${meter}
  <label>Confirm password${pw('p2', 'Repeat password', 'new-password')}</label>
  <button class="big full" style="margin-top:14px" data-a="setpw">Save new password</button>`
  }[m];
  const fire = m === 'signup', flip = S.lastMode !== undefined && ((S.lastMode === 'signup') !== fire);
  return `<div class="authwrap m-${m}${flip ? ' flip' : ''}"><div class="aside ${fire ? 'fire' : 'water'}">${fire ? FIRE : WATER}<div class="brand">${BOOK} CSE Department</div>
  <div class="at"><h1>${T[0]}</h1><p>${T[1]}</p>${m === 'login' || m === 'signup' ? `<button class="ghost" data-a="mode">${fire ? 'Log in' : 'Create account'}</button>` : ''}</div>
  <ul class="perks"><li>${LCK} Private notes, unlocked by your teachers</li><li>${EYE} Read online in a big, clean viewer</li><li>${LAY} Organised subject by subject</li></ul></div>
  <div class="formside"><div class="fcard">${S.msg ? `<div class="${S.ok ? 'fok' : 'ferr'}">${esc(S.msg)}</div>` : ''}${F}</div></div></div>`;
}

/* Note card used in browse/search results. */
function docCard(n) {
  const r = reqOf(S.me.id, n.id), st = r && r.status;
  const lock = st === 'approved' ? `<span class="lk" style="color:var(--ok)">${UNL} Unlocked</span>` : st === 'pending' ? `<span class="lk">${CLK} Pending</span>` : `<span class="lk">${LCK} Locked</span>`;
  return `<div class="doc" style="--c:${col(n.subject)}" data-a="note" data-id="${n.id}"><div class="th">${emo(n.subject)}${lock}</div><div class="in"><b>${esc(n.title)}</b><div class="mut">${n.subject} · ${esc(uname(n.teacher))}</div></div></div>`;
}

/* Filtered + sorted note list for the browse view. */
function results() {
  const q = S.q.toLowerCase();
  let l = db.notes.filter(n => (!S.subject || n.subject === S.subject) && (!q || (n.title + n.subject + uname(n.teacher)).toLowerCase().includes(q)) && (!S.teacher || n.teacher === S.teacher) && (!S.unl || (reqOf(S.me.id, n.id) || {}).status === 'approved'));
  const so = S.sort || 'new'; l = l.slice().sort((a, b) => so === 'az' ? a.title.localeCompare(b.title) : so === 'old' ? a.id - b.id : b.id - a.id);
  return l.length ? `<div class="docs">${l.map(docCard).join('')}</div>` : '<div class="empty"><div>' + FILE + '</div><b>No notes found</b><span class="mut">Try another subject or clear the filters.</span></div>';
}

function studentView() {
  if (S.note) return reader();
  let h = tabs(['Browse', 'My requests']);
  if (S.tab === 'My requests') {
    const l = db.reqs.filter(r => r.student === S.me.id);
    return h + (l.length ? l.map(r => { const n = db.notes.find(x => x.id === r.note); return `<div class="card row" style="cursor:pointer" data-a="note" data-id="${n.id}"><span>${emo(n.subject)} <b>${esc(n.title)}</b> <span class="mut">${n.subject}</span></span><span class="tag ${r.status}">${r.status}</span></div>`; }).join('') : '<div class="card mut">You haven’t requested any notes yet.</div>');
  }
  if (!S.subject && !S.q) h += noticeBar() + `<div class="hero"><h1>Hi ${esc(S.me.name.split(' ')[0])}</h1><p>Pick a subject, find your notes, request access from the teacher.</p><div class="chips"><span>${FILE} ${db.notes.length} notes</span><span>${BOOK} ${SUBJ.length} subjects</span><span>${UNL} ${db.reqs.filter(r => r.status === 'approved').length} unlocked for you</span></div></div>
  <h3>Browse by subject</h3><div class="grid">${SUBJ.map(([s, e]) => `<div class="sub" style="--c:${col(s)}" data-a="subject" data-v="${s}"><div class="e">${e}</div><b>${s}</b><div class="mut">${db.notes.filter(n => n.subject === s).length} notes</div></div>`).join('')}</div><h3>Latest notes</h3>`;
  else h += `<div class="crumb"><a data-a="home">All subjects</a>${S.subject ? ' › ' + S.subject : ''}</div>${S.subject ? `<div class="sbanner" style="--c:${col(S.subject)}"><span>${emo(S.subject)}</span><div><b>${S.subject}</b><div>${db.notes.filter(n => n.subject === S.subject).length} notes</div></div></div><div class="chiprow">${SUBJ.map(([s]) => `<button class="sc ${s === S.subject ? 'on' : ''}" style="--c:${col(s)}" data-a="subject" data-v="${s}">${emo(s)} ${s}</button>`).join('')}</div>` : '<h3>Search results</h3>'}`;
  return h + filters() + `<div id="res">${results()}</div>`;
}

function reader() {
  const n = db.notes.find(x => x.id === S.note); if (!n) { S.note = null; return ''; }
  const r = reqOf(S.me.id, n.id), st = r && r.status, priv = S.me.role === 'admin' || n.teacher === S.me.id, ok = priv || st === 'approved';
  const head = `<div class="crumb"><a data-a="back">← Back</a> › ${n.subject} › ${esc(n.title)}</div>`;
  const bar = `<div class="rh"><div><b>${esc(n.title)}</b><div class="mut">${n.subject} · by ${esc(uname(n.teacher))}</div></div><div class="acts"><button class="g" data-a="back">← Back</button>${priv ? `<button class="g" data-a="dl" data-id="${n.id}">${DL} Download</button>` : ''}${ok ? `<button data-a="full">${FS} Fullscreen</button>` : ''}</div></div>`;
  if (ok) return head + `<div class="reader">${bar}${tools()}<div class="rprog"><i id="rpb"></i></div><div class="pg rm-${S.rm || 'light'}" id="pg"><div class="pages" id="pages"><div class="boot"><div class="spin"></div><div>Loading pages…</div></div></div><div class="wm">${esc(S.me.name)}<br>${esc(S.me.email || '')}</div></div></div>`;
  const act = st === 'pending' ? '<span class="tag pending">' + CLK + ' Request pending – waiting for teacher</span>' : `<button class="big" data-a="request" data-id="${n.id}">${st ? 'Request access again' : 'Request access'}</button>`;
  return head + `<div class="reader">${bar}<div class="lock"><div class="e">${LCK}</div><h2>This note is locked</h2><p class="mut">Send a request to ${esc(uname(n.teacher))}. Once approved, you can read this PDF here.</p>${st && st !== 'pending' ? `<p><span class="tag ${st}">Last request: ${st}</span></p>` : ''}${act}</div></div>`;
}

function teacherView() {
  if (S.note) return reader();
  if (S.edit) {
    const n = db.notes.find(x => x.id === S.edit); if (n) return `<div class="crumb"><a data-a="canceledit">← My notes</a></div><div class="card"><h3 style="margin-top:0">Edit note</h3><label>Title<input id="et" value="${esc(n.title)}" maxlength="120"></label><label>Subject<select id="es">${SUBJ.map(([s]) => `<option ${s === n.subject ? 'selected' : ''}>${esc(s)}</option>`).join('')}</select></label><label>Replace the PDF (optional)<input id="ef" type="file" accept="application/pdf"></label><p class="mut">Students who already have access keep it after you replace the file.</p><button class="big" data-a="savenote" data-id="${n.id}">Save changes</button> <button class="g" data-a="canceledit">Cancel</button></div>`;
  }
  const mine = db.notes.filter(n => n.teacher === S.me.id).map(n => n.id), rq = db.reqs.filter(r => mine.includes(r.note)), pend = rq.filter(r => r.status === 'pending').length;
  let h = `<div class="stats"><div class="card"><b>${mine.length}</b><span class="mut">My notes</span></div><div class="card"><b>${pend}</b><span class="mut">Pending requests</span></div><div class="card"><b>${rq.filter(r => r.status === 'approved').length}</b><span class="mut">Students with access</span></div></div>` + tabs(['Requests', 'My notes', 'Upload'], { Requests: pend });
  if (S.tab === 'Upload') return h + `<div class="card"><h3 style="margin-top:0">Upload a PDF</h3><input id="t" placeholder="Note title"><select id="s">${SUBJ.map(([s]) => `<option>${s}</option>`).join('')}</select><label class="drop" id="dz">${UPL}<span id="fn">Click or drop a PDF here</span><input id="f" type="file" accept="application/pdf" hidden></label><button class="big" data-a="upload">Upload</button></div>`;
  if (S.tab === 'My notes') return h + (mine.length ? db.notes.filter(n => n.teacher === S.me.id).map(n => `<div class="card row"><span class="who"><span class="ic" style="--c:${col(n.subject)}">${emo(n.subject)}</span><span><b>${esc(n.title)}</b><div class="mut">${n.subject}</div></span></span><span class="btns"><button data-a="note" data-id="${n.id}">Open</button><button class="g" data-a="editnote" data-id="${n.id}">Edit</button><button class="g" data-a="dl" data-id="${n.id}">${DL} Download</button><button class="bad" data-a="delnote" data-id="${n.id}">Delete</button></span></div>`).join('') : '<div class="card mut">Nothing uploaded yet.</div>');
  return h + (rq.length ? rq.map(r => { const n = db.notes.find(x => x.id === r.note);
    const b = r.status === 'pending' ? `<button class="ok" data-a="decide" data-id="${r.id}" data-v="approved">Approve</button> <button class="bad" data-a="decide" data-id="${r.id}" data-v="rejected">Reject</button>` : r.status === 'approved' ? `<button class="bad" data-a="decide" data-id="${r.id}" data-v="revoked">Revoke</button>` : '';
    return `<div class="card row"><span><b>${esc(uname(r.student))}</b> → ${esc(n.title)} <span class="tag ${r.status}">${r.status}</span></span><span>${b}</span></div>`;
  }).join('') : '<div class="card mut">No requests yet.</div>');
}

function adminView() {
  if (S.note) return reader();
  const pt = db.users.filter(u => u.role === 'teacher' && u.status === 'pending'), ts = db.users.filter(u => u.role === 'teacher' && u.status === 'active');
  const av = u => `<span class="av sm">${esc((u.name || '?')[0])}</span>`, nn = id => db.notes.filter(n => n.teacher === id).length;
  const del = id => `<button class="bad" data-a="deluser" data-id="${id}">Delete</button>`;
  let h = `<div class="stats"><div class="card"><b>${db.users.filter(u => u.role === 'student').length}</b><span class="mut">Students</span></div><div class="card"><b>${ts.length}</b><span class="mut">Teachers</span></div><div class="card"><b>${db.notes.length}</b><span class="mut">Notes</span></div><div class="card"><b>${pt.length}</b><span class="mut">Awaiting approval</span></div></div>` + tabs(['Pending teachers', 'Teachers', 'Users', 'Notes', 'Subjects', 'Notices'], { 'Pending teachers': pt.length });
  if (S.tab === 'Teachers') return h + (ts.length ? ts.map(u => `<div class="card row"><span class="who">${av(u)}<span><b>${esc(u.name)}</b><div class="mut">${esc(u.email)} · ${nn(u.id)} notes</div></span></span>${del(u.id)}</div>`).join('') : '<div class="empty"><div>' + USR + '</div><b>No teachers yet</b></div>');
  if (S.tab === 'Subjects') {
    const opts = k => Object.keys(ICONS).map(i => `<option value="${i}" ${i === k ? 'selected' : ''}>${ICON_NAMES[i]}</option>`).join('');
    const list = (db.subjects || []).map(s => `<div class="card row"><span class="who"><span class="ic" style="--c:${col(s.name)}">${emo(s.name)}</span><span><b>${esc(s.name)}</b><div class="mut">${db.notes.filter(n => n.subject === s.name).length} notes</div></span></span><span class="btns"><select class="isel" data-s="${esc(s.name)}" title="Icon">${opts(s.icon)}</select><button class="g" data-a="subren" data-v="${esc(s.name)}">Rename</button><button class="bad" data-a="subdel" data-v="${esc(s.name)}">Delete</button></span></div>`).join('');
    return h + `<div class="card"><b>Add a subject</b><div class="addrow"><input id="sn" placeholder="Subject name, e.g. Operating Systems" maxlength="40"><select id="si">${opts('file')}</select><button data-a="subadd">Add subject</button></div></div>` + (list || '<div class="card mut">No subjects found. Run subjects_update.sql in the SQL Editor first.</div>');
  }
  if (S.tab === 'Notices') return h + `<div class="card"><b>Post a notice</b><div class="mut">It appears at the top of the student home page.</div><textarea id="nm" maxlength="300" rows="3" placeholder="e.g. Unit 2 test notes are now uploaded"></textarea><button data-a="notepost">Post notice</button></div>` + ((db.notices || []).map(n => `<div class="card row"><span class="who"><span class="ic" style="--c:var(--pri)">${BELL}</span><span><div>${esc(n.message)}</div><div class="mut">${new Date(n.created_at).toLocaleDateString()}</div></span></span><button class="bad" data-a="notedel" data-id="${n.id}">Delete</button></div>`).join('') || '<div class="empty"><div>' + BELL + '</div><b>No notices yet</b></div>');
  if (S.tab === 'Users') return h + db.users.map(u => `<div class="card row"><span class="who">${av(u)}<span><b>${esc(u.name)}</b> <span class="tag">${u.role} · ${u.status}</span><div class="mut">${esc(u.email)}</div></span></span>${u.role === 'admin' ? '' : del(u.id)}</div>`).join('');
  if (S.tab === 'Notes') return h + (db.notes.length ? db.notes.map(n => `<div class="card row"><span class="who"><span class="ic" style="--c:${col(n.subject)}">${emo(n.subject)}</span><span><b>${esc(n.title)}</b><div class="mut">${n.subject} · ${esc(uname(n.teacher))}</div></span></span><span class="btns"><button data-a="note" data-id="${n.id}">Open</button><button class="g" data-a="dl" data-id="${n.id}">${DL} Download</button><button class="bad" data-a="delnote" data-id="${n.id}">Delete</button></span></div>`).join('') : '<div class="empty"><div>' + FILE + '</div><b>No notes yet</b></div>');
  return h + (pt.length ? pt.map(u => `<div class="card row"><span class="who">${av(u)}<span><b>${esc(u.name)}</b><div class="mut">${esc(u.email)}</div></span></span><span class="btns"><button class="ok" data-a="tstat" data-id="${u.id}" data-v="active">Approve</button><button class="bad" data-a="tstat" data-id="${u.id}" data-v="rejected">Reject</button></span></div>`).join('') : '<div class="empty"><div>' + CHK + '</div><b>No teachers waiting</b></div>');
}
