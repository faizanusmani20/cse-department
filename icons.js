/* CSE Notes - SVG icons, the subject list and small UI helpers (loaded before app.js) */
const I=p=>`<svg class="si" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
const FILE=I('<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>');
const BOOK=I('<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>');
const LCK=I('<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>');
const UNL=I('<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/>');
const CLK=I('<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>');
const DL=I('<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>');
const FS=I('<path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>');
const UPL=I('<polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/>');
const CHK=I('<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>');
const USR=I('<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>');
const LAY=I('<polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/>');
const SUBJ0=[
['COA',I('<rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><path d="M9 1v3M15 1v3M9 20v3M15 20v3M20 9h3M20 14h3M1 9h3M1 14h3"/>')],
['Python',I('<polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>')],
['Java with OOPs',I('<path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>')],
['UHV',I('<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>')],
['Cyber Security',I('<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/>')],
['Math-4',I('<path d="M18 4H6l7 8-7 8h12"/>')],
['DAA',I('<polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>')],
['TAFL',I('<circle cx="5" cy="12" r="3"/><circle cx="19" cy="5" r="3"/><circle cx="19" cy="19" r="3"/><line x1="7.6" y1="10.5" x2="16.4" y2="6.5"/><line x1="7.6" y1="13.5" x2="16.4" y2="17.5"/>')],
['Data Structure',I('<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>')],
['DSTL',LAY]];
const KEYS=['cpu','code','cube','heart','shield','sigma','activity','nodes','database','layers'];
const ICONS={};KEYS.forEach((k,i)=>ICONS[k]=SUBJ0[i][1]);
Object.assign(ICONS,{book:BOOK,file:FILE,
 globe:I('<circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>'),
 terminal:I('<polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/>'),
 pen:I('<path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>')});
const ICON_NAMES={cpu:'Chip',code:'Code',cube:'Cube',heart:'Heart',shield:'Shield',sigma:'Sigma',activity:'Graph',nodes:'Network',database:'Database',layers:'Layers',book:'Book',file:'Document',globe:'Globe',terminal:'Terminal',pen:'Pen'};
let SUBJ=SUBJ0.map((s,i)=>[s[0],ICONS[KEYS[i]]]);
const BELL=I('<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>');
const RMN={light:'Light page',sepia:'Sepia page',dark:'Dark page'};
const noticeBar=()=>(db.notices||[]).slice(0,2).map(n=>`<div class="notice">${BELL}<div><b>Notice</b><div>${esc(n.message)}</div><div class="mut">${new Date(n.created_at).toLocaleDateString()}</div></div></div>`).join('');
const filters=()=>{const ts=[...new Set(db.notes.map(n=>n.teacher))],so=S.sort||'new';
 return `<div class="fbar"><select data-f="sort" aria-label="Sort"><option value="new" ${so==='new'?'selected':''}>Newest first</option><option value="old" ${so==='old'?'selected':''}>Oldest first</option><option value="az" ${so==='az'?'selected':''}>Title A–Z</option></select><select data-f="teacher" aria-label="Teacher"><option value="">All teachers</option>${ts.map(t=>`<option value="${t}" ${S.teacher===t?'selected':''}>${esc(uname(t))}</option>`).join('')}</select><label class="chk"><input type="checkbox" data-f="unl" ${S.unl?'checked':''}> Unlocked only</label></div>`};
const tools=()=>`<div class="rtools"><div class="grp"><button class="g sq" data-a="zoom" data-v="-1" aria-label="Zoom out">−</button><span id="zl">${Math.round((S.zoom||1)*100)}%</span><button class="g sq" data-a="zoom" data-v="1" aria-label="Zoom in">+</button></div><div class="grp"><span>Page</span><input id="pj" type="number" min="1" value="1" aria-label="Go to page"><span id="pn">/ –</span></div><button class="g" id="rmb" data-a="rm">${RMN[S.rm||'light']}</button></div>`;
