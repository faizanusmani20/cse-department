/* CSE Notes - app logic: login, roles, notes, requests, admin, PDF reader */
const sb=supabase.createClient(SB_URL,SB_KEY);
let db={users:[],notes:[],reqs:[]};
const S={me:null,mode:'login',tab:'',subject:null,note:null,q:'',msg:'',ok:false};
const $=id=>document.getElementById(id),esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const uname=id=>(db.users.find(u=>u.id===id)||{name:'?'}).name,emo=s=>(SUBJ.find(x=>x[0]===s)||[0,FILE])[1];
const reqOf=(sid,nid)=>db.reqs.find(r=>r.student===sid&&r.note===nid);
const say=(m,ok)=>{S.msg=m;S.ok=!!ok};

function render(){
 if(S.loading){$('root').innerHTML='<div class="boot"><div class="spin"></div><div>Loading CSE Notes…</div></div>';return}
 const me=S.recovery?null:S.me;
 const nav=`<div class="top"><div class="bar"><div class="logo" data-a="home">${BOOK} CSE Notes</div>
 ${me&&me.role==='student'?`<input class="search" id="q" placeholder="Search notes, subjects or teachers…" value="${esc(S.q)}">`:'<div style="flex:1"></div>'}
 ${me?`<div class="chip"><div class="av">${esc(me.name[0])}</div><span>${esc(me.name)} · ${me.role}</span>${window._ip?'<button class="g" data-a="install">Install app</button>':''}<button class="g" data-a="logout">Log out</button></div>`:''}</div></div>`;
 const m=S.msg?`<div class="toast ${S.ok?'ok':'bad'}">${S.ok?'✓':'!'} ${esc(S.msg)}</div>`:'';
 const key=[me&&me.role,S.tab,S.subject,S.note,S.mode].join('|'),an=key!==S.key;S.key=key;
 $('root').innerHTML=(me?nav:'')+`<main class="${an?'anim':''}">${!me?authView():({student:studentView,teacher:teacherView,admin:adminView})[me.role]()}</main>${m}`;
S.lastMode=S.recovery?'reset':S.mode;
 if(an){document.querySelectorAll('.anim .grid>*,.anim .docs>*,.anim .card').forEach((e,i)=>e.style.animationDelay=Math.min(i,14)*45+'ms');
  document.querySelectorAll('.stats b').forEach(b=>{const t=+b.textContent;if(!t)return;let i=0;const s=()=>{i++;b.textContent=Math.round(t*Math.min(1,i/22));if(i<22)requestAnimationFrame(s)};s()})}
 if(S.msg&&!S.ok&&!me){const a=document.querySelector('.fcard');if(a)a.classList.add('shake')}
}
const SV='<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">';
const EYE=SV+'<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>';
const EYEOFF=SV+'<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>';
const col=s=>`hsl(${(SUBJ.findIndex(x=>x[0]===s)*36+230)%360} 70% 55%)`;
const pw=(id,ph,ac)=>`<div class="pw"><input id="${id}" type="password" placeholder="${ph}" autocomplete="${ac}"><button type="button" class="eye" data-a="eye" aria-label="Show or hide password">${EYE}</button></div>`;
const meter='<div class="sbar"><i id="sb"></i></div>';
const wave=(a,p)=>{let d='M0 120';for(let x=0;x<=2400;x+=30)d+=`L${x} ${(60+a*Math.sin(x/1200*Math.PI*2+p)).toFixed(1)}`;return d+'L2400 120Z'};
const WATER=`<div class="fx"><i class="caus"></i>${[[8,10,9,0],[22,16,12,2],[38,8,8,4],[52,14,11,1],[66,20,14,3],[80,9,9,5],[91,13,10,2]].map(([l,s,d,dl])=>`<i class="bub" style="left:${l}%;width:${s}px;height:${s}px;--d:${d}s;animation-delay:-${dl}s"></i>`).join('')}<svg class="wv w3" viewBox="0 0 2400 120" preserveAspectRatio="none"><path d="${wave(10,2.2)}"/></svg><svg class="wv w2" viewBox="0 0 2400 120" preserveAspectRatio="none"><path d="${wave(14,1)}"/></svg><svg class="wv w1" viewBox="0 0 2400 120" preserveAspectRatio="none"><path d="${wave(16,0)}"/></svg></div>`;
const FIRE=`<div class="fx"><i class="glow"></i>${[[-4,110,230,1.5,0],[12,90,190,1.2,.3],[27,120,260,1.7,.6],[45,100,210,1.3,.2],[61,115,250,1.6,.9],[77,95,200,1.4,.5],[91,105,225,1.5,.7]].map(([l,w,hh,d,dl])=>`<i class="fl" style="left:${l}%;width:${w}px;height:${hh}px;animation-duration:${d}s;animation-delay:-${dl}s"></i>`).join('')}${[[10,20,6,0],[24,-30,8,2],[38,25,7,4],[50,-15,9,1],[63,30,6,3],[76,-25,8,5],[88,15,7,2],[30,10,9,6]].map(([l,x,d,dl])=>`<i class="emb" style="left:${l}%;--x:${x}px;--d:${d}s;animation-delay:-${dl}s"></i>`).join('')}</div>`;
function authView(){
 const m=S.mode,E_=esc(S.em||''),N_=esc(S.nm||'');
 const T={login:['Welcome back','Log in to read the notes your teachers have shared.'],signup:['Join your department','Create an account and request notes subject by subject.'],forgot:['No worries','We’ll email you a link to reset your password.'],reset:['Almost done','Choose a new password for your account.']}[m]||[];
 const F={
 login:`<h2>Log in</h2><p class="mut">Use your email and password.</p>
  <label>Email<input id="e" type="email" value="${E_}" placeholder="you@college.edu" autocomplete="email"></label>
  <label>Password${pw('p','Your password','current-password')}</label>
  <div class="r"><button class="lnk" data-a="forgot">Forgot password?</button></div>
  <button class="big full" data-a="login">Log in</button>
  <div class="sw">New here? <button class="lnk" data-a="mode">Create an account</button></div>`,
 signup:`<h2>Create account</h2><p class="mut">It takes less than a minute.</p>
  <label>Full name<input id="n" value="${N_}" placeholder="Your name" autocomplete="name"></label>
  <label>I am a<select id="r"><option value="student">Student</option><option value="teacher">Teacher (needs admin approval)</option></select></label>
  <label>Email<input id="e" type="email" value="${E_}" placeholder="you@college.edu" autocomplete="email"></label>
  <label>Password${pw('p','8+ characters','new-password')}</label>${meter}
  <button class="big full" style="margin-top:14px" data-a="signup">Create account</button>
  <div class="sw">Already registered? <button class="lnk" data-a="mode">Log in</button></div>`,
 forgot:`<h2>Forgot password?</h2><p class="mut">Enter your email and we’ll send a reset link.</p>
  <label>Email<input id="e" type="email" value="${E_}" placeholder="you@college.edu"></label>
  <button class="big full" style="margin-top:14px" data-a="sendreset">Send reset link</button>
  <div class="sw"><button class="lnk" data-a="mode">← Back to log in</button></div>`,
 reset:`<h2>New password</h2><p class="mut">Use 8 or more characters.</p>
  <label>New password${pw('p','New password','new-password')}</label>${meter}
  <label>Confirm password${pw('p2','Repeat password','new-password')}</label>
  <button class="big full" style="margin-top:14px" data-a="setpw">Save new password</button>`}[m];
 const fire=m==='signup',flip=S.lastMode!==undefined&&((S.lastMode==='signup')!==fire);
 return `<div class="authwrap m-${m}${flip?' flip':''}"><div class="aside ${fire?'fire':'water'}">${fire?FIRE:WATER}<div class="brand">${BOOK} CSE Notes</div>
  <div class="at"><h1>${T[0]}</h1><p>${T[1]}</p>${m==='login'||m==='signup'?`<button class="ghost" data-a="mode">${fire?'Log in':'Create account'}</button>`:''}</div>
  <ul class="perks"><li>${LCK} Private notes, unlocked by your teachers</li><li>${EYE} Read online in a big, clean viewer</li><li>${LAY} Organised subject by subject</li></ul></div>
  <div class="formside"><div class="fcard">${S.msg?`<div class="${S.ok?'fok':'ferr'}">${esc(S.msg)}</div>`:''}${F}</div></div></div>`;
}
function tabs(l,badge={}){S.tab=l.includes(S.tab)?S.tab:l[0];return `<div class="tabs">${l.map(t=>`<button class="${t===S.tab?'on':''}" data-a="tab" data-v="${t}">${t}${badge[t]?`<span class="n">${badge[t]}</span>`:''}</button>`).join('')}</div>`}

function docCard(n){const r=reqOf(S.me.id,n.id),st=r&&r.status;
 const lock=st==='approved'?`<span class="lk" style="color:var(--ok)">${UNL} Unlocked</span>`:st==='pending'?`<span class="lk">${CLK} Pending</span>`:`<span class="lk">${LCK} Locked</span>`;
 return `<div class="doc" style="--c:${col(n.subject)}" data-a="note" data-id="${n.id}"><div class="th">${emo(n.subject)}${lock}</div><div class="in"><b>${esc(n.title)}</b><div class="mut">${n.subject} · ${esc(uname(n.teacher))}</div></div></div>`}
function results(){const q=S.q.toLowerCase();
 let l=db.notes.filter(n=>(!S.subject||n.subject===S.subject)&&(!q||(n.title+n.subject+uname(n.teacher)).toLowerCase().includes(q))&&(!S.teacher||n.teacher===S.teacher)&&(!S.unl||(reqOf(S.me.id,n.id)||{}).status==='approved'));
 const so=S.sort||'new';l=l.slice().sort((a,b)=>so==='az'?a.title.localeCompare(b.title):so==='old'?a.id-b.id:b.id-a.id);
 return l.length?`<div class="docs">${l.map(docCard).join('')}</div>`:'<div class="empty"><div>'+FILE+'</div><b>No notes found</b><span class="mut">Try another subject or clear the filters.</span></div>'}
function studentView(){
 if(S.note)return reader();
 let h=tabs(['Browse','My requests']);
 if(S.tab==='My requests'){const l=db.reqs.filter(r=>r.student===S.me.id);
  return h+(l.length?l.map(r=>{const n=db.notes.find(x=>x.id===r.note);return `<div class="card row" style="cursor:pointer" data-a="note" data-id="${n.id}"><span>${emo(n.subject)} <b>${esc(n.title)}</b> <span class="mut">${n.subject}</span></span><span class="tag ${r.status}">${r.status}</span></div>`}).join(''):'<div class="card mut">You haven’t requested any notes yet.</div>');}
 if(!S.subject&&!S.q)h+=noticeBar()+`<div class="hero"><h1>Hi ${esc(S.me.name.split(' ')[0])}</h1><p>Pick a subject, find your notes, request access from the teacher.</p><div class="chips"><span>${FILE} ${db.notes.length} notes</span><span>${BOOK} ${SUBJ.length} subjects</span><span>${UNL} ${db.reqs.filter(r=>r.status==='approved').length} unlocked for you</span></div></div>
  <h3>Browse by subject</h3><div class="grid">${SUBJ.map(([s,e])=>`<div class="sub" style="--c:${col(s)}" data-a="subject" data-v="${s}"><div class="e">${e}</div><b>${s}</b><div class="mut">${db.notes.filter(n=>n.subject===s).length} notes</div></div>`).join('')}</div><h3>Latest notes</h3>`;
 else h+=`<div class="crumb"><a data-a="home">All subjects</a>${S.subject?' › '+S.subject:''}</div>${S.subject?`<div class="sbanner" style="--c:${col(S.subject)}"><span>${emo(S.subject)}</span><div><b>${S.subject}</b><div>${db.notes.filter(n=>n.subject===S.subject).length} notes</div></div></div><div class="chiprow">${SUBJ.map(([s])=>`<button class="sc ${s===S.subject?'on':''}" style="--c:${col(s)}" data-a="subject" data-v="${s}">${emo(s)} ${s}</button>`).join('')}</div>`:'<h3>Search results</h3>'}`;
 return h+filters()+`<div id="res">${results()}</div>`;
}
function reader(){const n=db.notes.find(x=>x.id===S.note);if(!n){S.note=null;return ''}
 const r=reqOf(S.me.id,n.id),st=r&&r.status,priv=S.me.role==='admin'||n.teacher===S.me.id,ok=priv||st==='approved';
 const head=`<div class="crumb"><a data-a="back">← Back</a> › ${n.subject} › ${esc(n.title)}</div>`;
 const bar=`<div class="rh"><div><b>${esc(n.title)}</b><div class="mut">${n.subject} · by ${esc(uname(n.teacher))}</div></div><div class="acts"><button class="g" data-a="back">← Back</button>${priv?`<button class="g" data-a="dl" data-id="${n.id}">${DL} Download</button>`:''}${ok?`<button data-a="full">${FS} Fullscreen</button>`:''}</div></div>`;
 if(ok)return head+`<div class="reader">${bar}${tools()}<div class="pg rm-${S.rm||'light'}" id="pg"><div class="pages" id="pages"><div class="boot"><div class="spin"></div><div>Loading pages…</div></div></div><div class="wm">${esc(S.me.name)}<br>${esc(S.me.email||'')}</div></div></div>`;
 const act=st==='pending'?'<span class="tag pending">'+CLK+' Request pending – waiting for teacher</span>':`<button class="big" data-a="request" data-id="${n.id}">${st?'Request access again':'Request access'}</button>`;
 return head+`<div class="reader">${bar}<div class="lock"><div class="e">${LCK}</div><h2>This note is locked</h2><p class="mut">Send a request to ${esc(uname(n.teacher))}. Once approved, you can read this PDF here.</p>${st&&st!=='pending'?`<p><span class="tag ${st}">Last request: ${st}</span></p>`:''}${act}</div></div>`;
}
function teacherView(){if(S.note)return reader();
 if(S.edit){const n=db.notes.find(x=>x.id===S.edit);if(n)return `<div class="crumb"><a data-a="canceledit">← My notes</a></div><div class="card"><h3 style="margin-top:0">Edit note</h3><label>Title<input id="et" value="${esc(n.title)}" maxlength="120"></label><label>Subject<select id="es">${SUBJ.map(([s])=>`<option ${s===n.subject?'selected':''}>${esc(s)}</option>`).join('')}</select></label><label>Replace the PDF (optional)<input id="ef" type="file" accept="application/pdf"></label><p class="mut">Students who already have access keep it after you replace the file.</p><button class="big" data-a="savenote" data-id="${n.id}">Save changes</button> <button class="g" data-a="canceledit">Cancel</button></div>`}const mine=db.notes.filter(n=>n.teacher===S.me.id).map(n=>n.id),rq=db.reqs.filter(r=>mine.includes(r.note)),pend=rq.filter(r=>r.status==='pending').length;
 let h=`<div class="stats"><div class="card"><b>${mine.length}</b><span class="mut">My notes</span></div><div class="card"><b>${pend}</b><span class="mut">Pending requests</span></div><div class="card"><b>${rq.filter(r=>r.status==='approved').length}</b><span class="mut">Students with access</span></div></div>`+tabs(['Requests','My notes','Upload'],{Requests:pend});
 if(S.tab==='Upload')return h+`<div class="card"><h3 style="margin-top:0">Upload a PDF</h3><input id="t" placeholder="Note title"><select id="s">${SUBJ.map(([s])=>`<option>${s}</option>`).join('')}</select><label class="drop" id="dz">${UPL}<span id="fn">Click or drop a PDF here</span><input id="f" type="file" accept="application/pdf" hidden></label><button class="big" data-a="upload">Upload</button></div>`;
 if(S.tab==='My notes')return h+(mine.length?db.notes.filter(n=>n.teacher===S.me.id).map(n=>`<div class="card row"><span class="who"><span class="ic" style="--c:${col(n.subject)}">${emo(n.subject)}</span><span><b>${esc(n.title)}</b><div class="mut">${n.subject}</div></span></span><span class="btns"><button data-a="note" data-id="${n.id}">Open</button><button class="g" data-a="editnote" data-id="${n.id}">Edit</button><button class="g" data-a="dl" data-id="${n.id}">${DL} Download</button><button class="bad" data-a="delnote" data-id="${n.id}">Delete</button></span></div>`).join(''):'<div class="card mut">Nothing uploaded yet.</div>');
 return h+(rq.length?rq.map(r=>{const n=db.notes.find(x=>x.id===r.note);
  const b=r.status==='pending'?`<button class="ok" data-a="decide" data-id="${r.id}" data-v="approved">Approve</button> <button class="bad" data-a="decide" data-id="${r.id}" data-v="rejected">Reject</button>`:r.status==='approved'?`<button class="bad" data-a="decide" data-id="${r.id}" data-v="revoked">Revoke</button>`:'';
  return `<div class="card row"><span><b>${esc(uname(r.student))}</b> → ${esc(n.title)} <span class="tag ${r.status}">${r.status}</span></span><span>${b}</span></div>`}).join(''):'<div class="card mut">No requests yet.</div>');
}
function adminView(){
 if(S.note)return reader();
 const pt=db.users.filter(u=>u.role==='teacher'&&u.status==='pending'),ts=db.users.filter(u=>u.role==='teacher'&&u.status==='active');
 const av=u=>`<span class="av sm">${esc((u.name||'?')[0])}</span>`,nn=id=>db.notes.filter(n=>n.teacher===id).length;
 const del=id=>`<button class="bad" data-a="deluser" data-id="${id}">Delete</button>`;
 let h=`<div class="stats"><div class="card"><b>${db.users.filter(u=>u.role==='student').length}</b><span class="mut">Students</span></div><div class="card"><b>${ts.length}</b><span class="mut">Teachers</span></div><div class="card"><b>${db.notes.length}</b><span class="mut">Notes</span></div><div class="card"><b>${pt.length}</b><span class="mut">Awaiting approval</span></div></div>`+tabs(['Pending teachers','Teachers','Users','Notes','Subjects','Notices'],{'Pending teachers':pt.length});
 if(S.tab==='Teachers')return h+(ts.length?ts.map(u=>`<div class="card row"><span class="who">${av(u)}<span><b>${esc(u.name)}</b><div class="mut">${esc(u.email)} · ${nn(u.id)} notes</div></span></span>${del(u.id)}</div>`).join(''):'<div class="empty"><div>'+USR+'</div><b>No teachers yet</b></div>');
 if(S.tab==='Subjects'){const opts=k=>Object.keys(ICONS).map(i=>`<option value="${i}" ${i===k?'selected':''}>${ICON_NAMES[i]}</option>`).join('');
  const list=(db.subjects||[]).map(s=>`<div class="card row"><span class="who"><span class="ic" style="--c:${col(s.name)}">${emo(s.name)}</span><span><b>${esc(s.name)}</b><div class="mut">${db.notes.filter(n=>n.subject===s.name).length} notes</div></span></span><span class="btns"><select class="isel" data-s="${esc(s.name)}" title="Icon">${opts(s.icon)}</select><button class="g" data-a="subren" data-v="${esc(s.name)}">Rename</button><button class="bad" data-a="subdel" data-v="${esc(s.name)}">Delete</button></span></div>`).join('');
  return h+`<div class="card"><b>Add a subject</b><div class="addrow"><input id="sn" placeholder="Subject name, e.g. Operating Systems" maxlength="40"><select id="si">${opts('file')}</select><button data-a="subadd">Add subject</button></div></div>`+(list||'<div class="card mut">No subjects found. Run subjects_update.sql in the SQL Editor first.</div>')}
 if(S.tab==='Notices')return h+`<div class="card"><b>Post a notice</b><div class="mut">It appears at the top of the student home page.</div><textarea id="nm" maxlength="300" rows="3" placeholder="e.g. Unit 2 test notes are now uploaded"></textarea><button data-a="notepost">Post notice</button></div>`+((db.notices||[]).map(n=>`<div class="card row"><span class="who"><span class="ic" style="--c:var(--pri)">${BELL}</span><span><div>${esc(n.message)}</div><div class="mut">${new Date(n.created_at).toLocaleDateString()}</div></span></span><button class="bad" data-a="notedel" data-id="${n.id}">Delete</button></div>`).join('')||'<div class="empty"><div>'+BELL+'</div><b>No notices yet</b></div>');
 if(S.tab==='Users')return h+db.users.map(u=>`<div class="card row"><span class="who">${av(u)}<span><b>${esc(u.name)}</b> <span class="tag">${u.role} · ${u.status}</span><div class="mut">${esc(u.email)}</div></span></span>${u.role==='admin'?'':del(u.id)}</div>`).join('');
 if(S.tab==='Notes')return h+(db.notes.length?db.notes.map(n=>`<div class="card row"><span class="who"><span class="ic" style="--c:${col(n.subject)}">${emo(n.subject)}</span><span><b>${esc(n.title)}</b><div class="mut">${n.subject} · ${esc(uname(n.teacher))}</div></span></span><span class="btns"><button data-a="note" data-id="${n.id}">Open</button><button class="g" data-a="dl" data-id="${n.id}">${DL} Download</button><button class="bad" data-a="delnote" data-id="${n.id}">Delete</button></span></div>`).join(''):'<div class="empty"><div>'+FILE+'</div><b>No notes yet</b></div>');
 return h+(pt.length?pt.map(u=>`<div class="card row"><span class="who">${av(u)}<span><b>${esc(u.name)}</b><div class="mut">${esc(u.email)}</div></span></span><span class="btns"><button class="ok" data-a="tstat" data-id="${u.id}" data-v="active">Approve</button><button class="bad" data-a="tstat" data-id="${u.id}" data-v="rejected">Reject</button></span></div>`).join(''):'<div class="empty"><div>'+CHK+'</div><b>No teachers waiting</b></div>');
}
const urls={};
const dropUrls=()=>{for(const k in urls)delete urls[k]};
const E=r=>{if(r&&r.error){say(r.error.message||'Something went wrong. Try again.');return true}return false};
const EMPTY=()=>({users:[],notes:[],reqs:[]});
async function load(){
 const {data:{session}}=await sb.auth.getSession();
 if(!session){S.me=null;db=EMPTY();return}
 const {data:me}=await sb.from('profiles').select('*').eq('id',session.user.id).single();
 if(!me||me.status!=='active'){await sb.auth.signOut();S.me=null;db=EMPTY();return me?me.status:'none'}
 S.me=me;
 const cols=me.role==='admin'?'id,name,email,role,status':'id,name,role';
 const [u,n,r,sj,nt]=await Promise.all([sb.from('profiles').select(cols),sb.from('notes').select('id,title,subject,teacher_id,file_path').order('id',{ascending:false}),sb.from('requests').select('id,student_id,note_id,status'),sb.from('subjects').select('name,icon').order('pos'),sb.from('notices').select('id,message,created_at').order('id',{ascending:false}).limit(5)]);
 if(sj.data){SUBJ=sj.data.map(s=>[s.name,ICONS[s.icon]||FILE]);if(S.subject&&!SUBJ.some(s=>s[0]===S.subject))S.subject=null}
 db={notices:nt.data||[],subjects:sj.data||[],users:u.data||[],notes:(n.data||[]).map(x=>({...x,teacher:x.teacher_id})),reqs:(r.data||[]).map(x=>({...x,student:x.student_id,note:x.note_id}))};
}
async function ensureUrl(){
 const n=db.notes.find(x=>x.id===S.note);if(!n||!S.me||urls[n.id])return;
 const priv=S.me.role==='admin'||n.teacher===S.me.id,r=reqOf(S.me.id,n.id);
 if(!priv&&!(r&&r.status==='approved'))return;
 const d=await sb.storage.from('notes').download(n.file_path);
 if(d.error)say('Could not open this PDF. Access may have been revoked.');else urls[n.id]=d.data;
}
async function paint(){
 const b=S.note&&urls[S.note],box=$('pages');if(!b||!box)return;
 try{pdfjsLib.GlobalWorkerOptions.workerSrc='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
  if(S.io)S.io.disconnect();
  const pdf=await pdfjsLib.getDocument({data:await b.arrayBuffer()}).promise;box.innerHTML='';
  const dpr=Math.min(window.devicePixelRatio||1,1.5),w=Math.min(box.clientWidth-24,980)*(S.zoom||1),cs=[];
  for(let i=1;i<=pdf.numPages;i++){const pg=await pdf.getPage(i),v=pg.getViewport({scale:w/pg.getViewport({scale:1}).width*dpr}),c=document.createElement('canvas');
   c.width=v.width;c.height=v.height;c.style.width=w+'px';c.style.height=(v.height/dpr)+'px';c._pg=pg;c._v=v;box.appendChild(c);cs.push(c)}
  const pn=$('pn');if(pn)pn.textContent='/ '+cs.length;
  let saved=1;try{saved=+localStorage.getItem('lp:'+S.me.id+':'+S.note)||1}catch(e){}
  const start=Math.min(Math.max(S.pg||saved,1),cs.length);S.pg=0;box.scrollTop=cs[start-1].offsetTop-8;
  const setP=()=>{let p=1;cs.forEach((x,i)=>{if(x.offsetTop<=box.scrollTop+box.clientHeight/3)p=i+1});const j=$('pj');if(j&&document.activeElement!==j)j.value=p;try{localStorage.setItem('lp:'+S.me.id+':'+S.note,p)}catch(e){}};
  box.onscroll=()=>{clearTimeout(box._t);box._t=setTimeout(setP,150)};setP();
  S.io=new IntersectionObserver(es=>es.forEach(en=>{const c=en.target;if(en.isIntersecting&&!c._d){c._d=1;c._pg.render({canvasContext:c.getContext('2d'),viewport:c._v})}}),{root:box,rootMargin:'1400px 0px'});
  cs.forEach(c=>S.io.observe(c));
 }catch(e){box.innerHTML='<div class="empty" style="color:#fff"><div style="font-size:44px;font-weight:700">!</div><b>Could not display this PDF</b></div>'}
}
document.addEventListener('click',async e=>{
 const el=e.target.closest('[data-a]');if(!el||el.disabled)return;
 const a=el.dataset.a,rid=el.dataset.id,id=+rid,v=el.dataset.v;say('');if($('e'))S.em=$('e').value;if($('n'))S.nm=$('n').value;
 if(['login','signup','sendreset','setpw','request'].includes(a)){el.disabled=true;el.innerHTML='<span class="spin s"></span> Please wait'}
 let sync=false;
 if(a==='mode')S.mode=S.mode==='login'?'signup':'login';
 else if(a==='login'){const r=await sb.auth.signInWithPassword({email:$('e').value.trim(),password:$('p').value});
  if(r.error)say(r.error.message==='Invalid login credentials'?'Wrong email or password.':r.error.message);
  else{const bad=await load();if(bad==='pending')say('Your teacher account is waiting for admin approval.');
   else if(bad)say('Your account is not active. Contact the admin.');else{S.tab='';S.subject=null;S.note=null;S.q=''}}}
 else if(a==='signup'){const n=$('n').value.trim(),em=$('e').value.trim(),p=$('p').value,ro=$('r').value;
  if(!n||!em||p.length<8)say('Enter name, email and a password of 8+ characters.');
  else{const r=await sb.auth.signUp({email:em,password:p,options:{data:{name:n,role:ro}}});
   if(!E(r)){await sb.auth.signOut();S.mode='login';say(ro==='teacher'?'Account created. Wait for admin approval.':'Account created. Log in now.',true)}}}
 else if(a==='eye'){const i=el.parentElement.querySelector('input');i.type=i.type==='password'?'text':'password';el.innerHTML=i.type==='password'?EYE:EYEOFF;return}
 else if(a==='dl'){const n=db.notes.find(x=>x.id===id);if(n){el.disabled=true;const d=await sb.storage.from('notes').download(n.file_path);
  if(!E(d)){const u=URL.createObjectURL(d.data),k=document.createElement('a');k.href=u;k.download=(n.title.replace(/[^\w\- ]+/g,'').trim()||'note')+'.pdf';document.body.appendChild(k);k.click();k.remove();setTimeout(()=>URL.revokeObjectURL(u),5000);say('Download started.',true)}}}
 else if(a==='subadd'){const nm=$('sn').value.trim(),ic=$('si').value;
  if(nm.length<2)say('Enter a subject name (at least 2 letters).');
  else{const r=await sb.from('subjects').insert({name:nm,icon:ic});
   if(r.error)say(r.error.code==='23505'?'A subject with this name already exists.':r.error.message);else{say('Subject added.',true);sync=true}}}
 else if(a==='subren'){const t=(prompt('Rename subject',v)||'').trim();if(!t||t===v)return;
  const r=await sb.from('subjects').update({name:t}).eq('name',v);
  if(r.error)say(r.error.code==='23505'?'A subject with this name already exists.':r.error.message);else{if(S.subject===v)S.subject=t;say('Subject renamed. Its notes moved with it.',true);sync=true}}
 else if(a==='subdel'){if(db.notes.some(n=>n.subject===v))say('This subject still has notes. Delete or move them first.');
  else{if(!confirm('Delete the subject "'+v+'"?'))return;E(await sb.from('subjects').delete().eq('name',v));sync=true}}
 else if(a==='install'){if(window._ip){window._ip.prompt();window._ip=null}}
 else if(a==='zoom'){const box=$('pages');if(!box)return;const cs=[...box.querySelectorAll('canvas')];let p=1;cs.forEach((x,i)=>{if(x.offsetTop<=box.scrollTop+box.clientHeight/3)p=i+1});
  S.pg=p;S.zoom=Math.min(2.5,Math.max(.6,(S.zoom||1)+(+v)*.25));$('zl').textContent=Math.round(S.zoom*100)+'%';await paint();return}
 else if(a==='rm'){const m=['light','sepia','dark'];S.rm=m[(m.indexOf(S.rm||'light')+1)%3];try{localStorage.setItem('rm',S.rm)}catch(e){}
  $('pg').className='pg rm-'+S.rm;el.textContent=RMN[S.rm];return}
 else if(a==='notepost'){const m=$('nm').value.trim();if(m.length<3)say('Write a short notice first.');
  else{const r=await sb.from('notices').insert({message:m,created_by:S.me.id});if(!E(r)){say('Notice posted.',true);sync=true}}}
 else if(a==='notedel'){E(await sb.from('notices').delete().eq('id',id));sync=true}
 else if(a==='editnote')S.edit=id;
 else if(a==='canceledit')S.edit=null;
 else if(a==='savenote'){const n=db.notes.find(x=>x.id===id),t=$('et').value.trim(),sj=$('es').value,f=$('ef').files[0];
  if(!t)say('The title cannot be empty.');else if(f&&f.type!=='application/pdf')say('Only PDF files are allowed.');else if(f&&f.size>20*1024*1024)say('PDF must be under 20 MB.');
  else{el.disabled=true;el.textContent='Saving…';let path=n.file_path;
   if(f){path=`${S.me.id}/${crypto.randomUUID()}.pdf`;const u=await sb.storage.from('notes').upload(path,f,{contentType:'application/pdf'});if(E(u)){render();return}}
   const r=await sb.from('notes').update({title:t,subject:sj,file_path:path}).eq('id',id);
   if(E(r)){if(f)await sb.storage.from('notes').remove([path])}
   else{if(f)await sb.storage.from('notes').remove([n.file_path]);delete urls[id];S.edit=null;say('Note updated.',true);sync=true}}}
 else if(a==='forgot')S.mode='forgot';
 else if(a==='sendreset'){const em=$('e').value.trim();
  if(!em)say('Enter your email.');
  else{const r=await sb.auth.resetPasswordForEmail(em,{redirectTo:location.origin+location.pathname});
   if(!E(r)){S.mode='login';say('If this email is registered, a reset link is on its way. Check your inbox and spam folder.',true)}}}
 else if(a==='setpw'){const p=$('p').value,p2=$('p2').value;
  if(p.length<8)say('Password must be 8 or more characters.');else if(p!==p2)say('The two passwords do not match.');
  else{const r=await sb.auth.updateUser({password:p});
   if(!E(r)){await sb.auth.signOut();S.recovery=false;S.mode='login';history.replaceState(null,'',location.pathname);say('Password changed. Log in with your new password.',true)}}}
 else if(a==='logout'){S.edit=null;dropUrls();await sb.auth.signOut();S.me=null;db=EMPTY();S.note=null;S.subject=null;S.q=''}
 else if(a==='home'){S.subject=null;S.note=null;S.q='';S.tab='Browse'}
 else if(a==='subject'){S.subject=v;S.note=null;S.tab='Browse'}
 else if(a==='note')S.note=id;
 else if(a==='back')S.note=null;
 else if(a==='tab'){S.tab=v;S.note=null;S.edit=null}
 else if(a==='full'){const p=document.querySelector('.reader');if(p&&p.requestFullscreen)p.requestFullscreen();return}
 else if(a==='request'){const old=reqOf(S.me.id,id);
  const r=old?await sb.from('requests').update({status:'pending'}).eq('id',old.id):await sb.from('requests').insert({student_id:S.me.id,note_id:id});
  if(!E(r))say('Request sent to the teacher.',true);sync=true}
 else if(a==='decide'){E(await sb.from('requests').update({status:v}).eq('id',id));sync=true}
 else if(a==='tstat'){E(await sb.from('profiles').update({status:v}).eq('id',rid));sync=true}
 else if(a==='deluser'){if(!confirm('Delete this user and all their notes? This cannot be undone.'))return;const paths=db.notes.filter(n=>n.teacher===rid).map(n=>n.file_path);
  if(paths.length)await sb.storage.from('notes').remove(paths);E(await sb.rpc('admin_delete_user',{uid:rid}));sync=true}
 else if(a==='delnote'){if(!confirm('Delete this note permanently?'))return;const n=db.notes.find(x=>x.id===id);if(n){await sb.storage.from('notes').remove([n.file_path]);E(await sb.from('notes').delete().eq('id',id))}sync=true}
 else if(a==='upload'){const f=$('f').files[0],t=$('t').value.trim();
  if(!t||!f)say('Add a title and choose a PDF.');else if(f.type!=='application/pdf')say('Only PDF files are allowed.');
  else if(f.size>20*1024*1024)say('PDF must be under 20 MB.');
  else{el.disabled=true;el.textContent='Uploading…';const path=`${S.me.id}/${crypto.randomUUID()}.pdf`;
   let r=await sb.storage.from('notes').upload(path,f,{contentType:'application/pdf'});
   if(!E(r)){r=await sb.from('notes').insert({title:t,subject:$('s').value,teacher_id:S.me.id,file_path:path});
    if(E(r))await sb.storage.from('notes').remove([path]);else{S.tab='My notes';say('Note uploaded.',true);sync=true}}}}
 if(sync)await load();
 if(!S.note)dropUrls();else await ensureUrl();
 render();window.scrollTo(0,0);paint();
});
document.addEventListener('input',e=>{if(e.target.id==='q'){S.q=e.target.value;S.note=null;const r=$('res');if(r)r.innerHTML=results();else{render();const q=$('q');q.focus();q.setSelectionRange(q.value.length,q.value.length)}}});
sb.auth.onAuthStateChange(ev=>{if(ev==='PASSWORD_RECOVERY'){S.recovery=true;S.mode='reset';render()}});
if(location.hash.includes('otp_expired'))say('This reset link has expired. Please request a new one.');
document.addEventListener('keydown',e=>{if(e.key==='Enter'&&e.target.closest&&e.target.closest('.fcard')){const b=document.querySelector('.fcard .big');if(b)b.click()}});
document.addEventListener('input',e=>{if(e.target.id==='p'&&$('sb')){const v=e.target.value;let s=0;if(v.length>=8)s++;if(/[A-Z]/.test(v)&&/[a-z]/.test(v))s++;if(/\d/.test(v))s++;if(/[^A-Za-z0-9]/.test(v)||v.length>=12)s++;$('sb').style.width=s*25+'%';$('sb').style.background=['#dc2626','#dc2626','#d97706','#16a34a','#16a34a'][s]}});
document.addEventListener('change',e=>{if(e.target.id==='f'){const f=e.target.files[0];$('fn').textContent=f?f.name+' ('+(f.size/1048576).toFixed(1)+' MB)':'Click or drop a PDF here'}});
['dragover','dragleave','drop'].forEach(t=>document.addEventListener(t,e=>{const dz=e.target.closest&&e.target.closest('#dz');if(!dz)return;e.preventDefault();if(t==='drop'){const i=$('f');i.files=e.dataTransfer.files;i.dispatchEvent(new Event('change',{bubbles:true}))}dz.classList.toggle('over',t==='dragover')}));
document.addEventListener('change',async e=>{if(e.target.classList&&e.target.classList.contains('isel')){const r=await sb.from('subjects').update({icon:e.target.value}).eq('name',e.target.dataset.s);if(!E(r))say('Icon updated.',true);await load();render()}});
try{S.rm=localStorage.getItem('rm')||'light'}catch(e){S.rm='light'}
if('serviceWorker' in navigator)navigator.serviceWorker.register('/sw.js').catch(()=>{});
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();window._ip=e;if(S.me&&!S.loading)render()});
document.addEventListener('change',e=>{const f=e.target.dataset&&e.target.dataset.f;
 if(f){S[f]=f==='unl'?e.target.checked:e.target.value;const r=$('res');if(r)r.innerHTML=results()}
 if(e.target.id==='pj'){const box=$('pages'),cs=box?box.querySelectorAll('canvas'):[];if(cs.length){const p=Math.min(Math.max(+e.target.value||1,1),cs.length);box.scrollTop=cs[p-1].offsetTop-8}}});
document.addEventListener('keydown',e=>{if(e.key==='Enter'&&e.target.id==='pj')e.target.dispatchEvent(new Event('change',{bubbles:true}))});
document.addEventListener('contextmenu',e=>{if(e.target.closest&&e.target.closest('.pg'))e.preventDefault()});
window.addEventListener('unhandledrejection',e=>{say('Something went wrong: '+((e.reason&&e.reason.message)||e.reason));render()});
S.loading=true;render();
(async()=>{await load();S.loading=false;render()})();
