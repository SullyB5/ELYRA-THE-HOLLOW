/* Elyra controls (Oct 27, Bryce: "a way to select which buttons for controls"). Two parts, shared by every page:

   KEYS: PC key rebinding. Every chapter reads the keyboard by its original key codes (keys.KeyW, e.code==='KeyF', ...), so nothing in
   the chapters changes: this file listens first (window, capture phase, loaded before any chapter script) and turns the key you chose
   into the key the game knows, as a copy of the same press. The original key of a moved action is swallowed, so it doesn't also fire.
   Esc, Enter, P and Y/N (pause, menus, the Spear's choice) can't be taken. Saved in localStorage elyra.keys.v1 as {defaultCode: yourCode}.
   The mouse buttons stay as they are (left fire, right aim/guns).

   TOUCH: the phone's button layout. In a chapter, the pause menu's Button layout shows every touch button at once: drag one to move it,
   the slider sizes the one picked, Reset puts it back. Kept per kind of HUD (all the on-foot chapters share one layout; the space battle
   and Tide City's sky each have their own) in localStorage elyra.touch.v1, as offsets in screen widths and heights, so a different phone
   keeps the same arrangement. Applied with the CSS translate and scale properties, which add to whatever the button's own styles do.

   On the menu page (script tag with data-menu) only the Controls panel is used; no keys are changed there. */
const KEYS=(()=>{
  const ACTIONS=[
    ['KeyW','Move forward','Throttle up in flight'],
    ['KeyS','Move back','Throttle down in flight'],
    ['KeyA','Move left','Slide left in flight'],
    ['KeyD','Move right','Slide right in flight'],
    ['ShiftLeft','Sprint','Boost in vehicles and flight'],
    ['Space','Jump','Climb in flight'],
    ['KeyC','Crouch','Dive in flight'],
    ['KeyE','Use · board · pick up','Guns on the ground, ammo boxes; climb in flight'],
    ['KeyQ','Mobile shield','Dive in flight'],
    ['KeyX','Shoulder sentry',''],
    ['KeyG','Crew a sea gun','Tide City'],
    ['KeyF','Missile','In flight'],
    ['KeyR','Reload',''],
    ['KeyZ','Scope zoom','Sniper: 4x / 7x while scoped'],
    ['Tab','Next weapon',''],
    // (Oct 27: two weapons on foot; 3 throws a grenade and 4 burns Zeal, with the middle mouse button too)
    ['Digit1','Primary weapon',''],['Digit2','Secondary weapon',''],['Digit3','Grenade',''],['Digit4','Zeal','Middle mouse button too'],
    ['KeyV','Camera view','First / third person on foot'],
    ['KeyM','Sound on / off',''],
  ];
  const DEF=new Set(ACTIONS.map(a=>a[0]));
  const RESERVED=new Set(['Escape','Enter','NumpadEnter','KeyP','KeyY','KeyN','MetaLeft','MetaRight','OSLeft','OSRight','ContextMenu','CapsLock']);
  const LS='elyra.keys.v1';
  let map={};try{map=JSON.parse(localStorage.getItem(LS)||'{}')||{};}catch(_){map={};}
  for(const k in map)if(!DEF.has(k)||typeof map[k]!=='string'||RESERVED.has(map[k]))delete map[k];
  const code=d=>map[d]||d;
  const NAMES={Space:'Space',ShiftLeft:'Shift',ShiftRight:'R-Shift',ControlLeft:'Ctrl',ControlRight:'R-Ctrl',AltLeft:'Alt',AltRight:'R-Alt',Tab:'Tab',Backspace:'Backspace',
    ArrowUp:'↑',ArrowDown:'↓',ArrowLeft:'←',ArrowRight:'→',Backquote:'`',Minus:'-',Equal:'=',BracketLeft:'[',BracketRight:']',Backslash:'\\',Semicolon:';',Quote:"'",
    Comma:',',Period:'.',Slash:'/',Insert:'Ins',Delete:'Del',Home:'Home',End:'End',PageUp:'PgUp',PageDown:'PgDn'};
  function name(c){if(!c)return'—';if(NAMES[c])return NAMES[c];let m;
    if((m=/^Key([A-Z])$/.exec(c)))return m[1];if((m=/^Digit(\d)$/.exec(c)))return m[1];if((m=/^Numpad(.+)$/.exec(c)))return'Num '+m[1];if(/^F\d+$/.test(c))return c;return c;}
  // what e.key would have been for the game's own key (only the menu reads e.key, and it never sees a copy)
  const keyOf=c=>{let m;if((m=/^Key([A-Z])$/.exec(c)))return m[1].toLowerCase();if((m=/^Digit(\d)$/.exec(c)))return m[1];return{Space:' ',Tab:'Tab',ShiftLeft:'Shift'}[c]||c;};
  let fwd={},swallow=new Set();
  function rebuild(){fwd={};swallow=new Set();
    for(const [d] of ACTIONS){const u=code(d);if(u!==d){fwd[u]=d;swallow.add(d);}}
    for(const u in fwd)swallow.delete(u);}
  rebuild();
  function save(){try{localStorage.setItem(LS,JSON.stringify(map));}catch(_){}rebuild();relabel();for(const f of hooks)try{f();}catch(_){}}
  const hooks=[];
  // bind: give action d the key c; whoever had c gets d's old key (a swap), so no key ever does two things
  function bind(d,c){if(RESERVED.has(c))return false;const old=code(d);
    for(const [o] of ACTIONS){if(o!==d&&code(o)===c){if(old===o)delete map[o];else map[o]=old;}}
    if(c===d)delete map[d];else map[d]=c;save();return true;}
  function reset(){map={};save();}

  const menuOnly=!!(document.currentScript&&document.currentScript.hasAttribute('data-menu'));
  let capture=null;   // the Controls panel, waiting for the next key
  function onKey(e){
    if(!e.isTrusted)return;
    if(capture){if(e.type!=='keydown')return;e.preventDefault();e.stopImmediatePropagation();capture(e.code);return;}
    if(panel&&!panel.hidden){if(e.type==='keydown'&&e.code==='Escape'){e.preventDefault();e.stopImmediatePropagation();close();}return;}   // (Esc closes the panel, not the pause menu under it)
    if(menuOnly)return;
    const t=e.target;if(t&&t.tagName&&/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))return;
    const c=e.code,to=fwd[c];
    if(to){e.stopImmediatePropagation();
      const ev=new KeyboardEvent(e.type,{code:to,key:keyOf(to),repeat:e.repeat,bubbles:true,cancelable:true,shiftKey:e.shiftKey,ctrlKey:e.ctrlKey,altKey:e.altKey,metaKey:e.metaKey});
      (t&&t.dispatchEvent?t:document).dispatchEvent(ev);if(ev.defaultPrevented)e.preventDefault();}
    else if(swallow.has(c)){e.stopImmediatePropagation();if(e.type==='keydown'&&/^(Space|Tab)$/.test(c))e.preventDefault();}
  }
  addEventListener('keydown',onKey,true);addEventListener('keyup',onKey,true);

  // ---- labels: the gear strip's key letters, and the briefing's control lists (KEYS.label on their key column) ----
  const LABEL_OF={W:'KeyW',A:'KeyA',S:'KeyS',D:'KeyD',Shift:'ShiftLeft',Space:'Space',C:'KeyC',E:'KeyE',Q:'KeyQ',X:'KeyX',G:'KeyG',F:'KeyF',R:'KeyR',Tab:'Tab',V:'KeyV',M:'KeyM','1':'Digit1','2':'Digit2','3':'Digit3','4':'Digit4'};
  function label(text){if(!Object.keys(map).length||typeof text!=='string')return text;
    // only whole tokens that are key names ("W A S D", "Space / Q", "Left-click / F", "1-4")
    return text.replace(/(^|[\s\/(·,])([A-Z]|Shift|Space|Tab|[1-4])(?=$|[\s\/)·,\-–])/g,(m,pre,k)=>{const d=LABEL_OF[k];return d&&map[d]?pre+name(map[d]):m;})
      .replace(/\b1\s*[-–]\s*4\b/,m=>['Digit1','Digit2','Digit3','Digit4'].some(d=>map[d])?['Digit1','Digit2','Digit3','Digit4'].map(d=>name(code(d))).join(' '):m);}
  function relabel(){for(const [id,d] of[['gShield','KeyQ'],['gSentry','KeyX'],['gNade','Digit3'],['gZeal','Digit4']]){const b=document.querySelector('#'+id+' b');if(b)b.textContent=name(code(d));}}
  if(document.readyState==='loading')addEventListener('DOMContentLoaded',relabel,{once:true});else relabel();

  // ---- the Controls panel ----
  let css=false;
  function style(){if(css)return;css=true;const s=document.createElement('style');s.textContent=`
.kb{position:fixed;inset:0;z-index:90;display:grid;place-items:center;background:rgba(0,0,0,.66);padding:14px;overflow:auto}
.kb[hidden]{display:none!important}
.kb .in{width:min(560px,100%);max-height:calc(100% - 8px);overflow:auto;display:flex;flex-direction:column;gap:8px;padding:18px 18px 14px;background:rgba(6,10,22,.94);
  border:1px solid rgba(140,200,255,.32);border-radius:4px;color:#eef4ff;font:500 13px/1.4 'Chakra Petch','Arial Narrow',system-ui,sans-serif}
.kb h2{margin:0;font:700 18px 'Chakra Petch','Arial Narrow',sans-serif;letter-spacing:.3em}
.kb p{margin:0;color:rgba(220,232,255,.66);font-size:12px}
.kb .rows{display:grid;grid-template-columns:1fr 1fr;gap:4px 14px}
@media (max-width:560px){.kb .rows{grid-template-columns:1fr}}
.kb .row{display:grid;grid-template-columns:1fr auto;align-items:center;gap:8px;padding:3px 0;border-bottom:1px solid rgba(140,200,255,.1)}
.kb .row span small{display:block;color:rgba(220,232,255,.48);font-size:10.5px;line-height:1.2}
.kb .row button{min-width:72px;padding:7px 10px;border-radius:3px;border:1px solid rgba(140,200,255,.4);background:rgba(20,34,60,.7);color:#eef4ff;
  font:700 12px 'JetBrains Mono',ui-monospace,monospace;cursor:pointer}
.kb .row button.moved{border-color:#ffd27a;color:#ffd27a}
.kb .row button.wait{background:#2d6fd6;border-color:#5aa0ff;animation:kbp 1s infinite}
@keyframes kbp{50%{opacity:.6}}
.kb .fixed{display:grid;grid-template-columns:auto 1fr;gap:2px 12px;font:400 11px/1.4 'JetBrains Mono',ui-monospace,monospace;color:rgba(220,232,255,.6)}
.kb .bar{display:flex;gap:8px;justify-content:flex-end;margin-top:4px}
.kb .bar button{padding:10px 14px;border-radius:3px;border:1px solid rgba(140,200,255,.4);background:rgba(20,34,60,.7);color:#eef4ff;
  font:700 12px 'Chakra Petch','Arial Narrow',sans-serif;letter-spacing:.16em;text-transform:uppercase;cursor:pointer}
.kb .bar button.primary{background:#2d6fd6;border-color:#5aa0ff}
.kb .msg{min-height:16px;font-size:11px;color:#ffd27a}
.kb button:focus-visible{outline:2px solid #7fe3ff;outline-offset:2px}`;document.head.appendChild(s);}
  let panel=null,onClose=null;
  function draw(){const rows=panel.querySelector('.rows');
    rows.innerHTML=ACTIONS.map(([d,l,sub])=>`<div class="row"><span>${l}${sub?`<small>${sub}</small>`:''}</span><button type="button" data-d="${d}" class="${map[d]?'moved':''}" aria-label="${l}: ${name(code(d))}. Change">${name(code(d))}</button></div>`).join('');}
  function open(done){style();onClose=done||null;
    if(!panel){panel=document.createElement('div');panel.className='kb';panel.setAttribute('role','dialog');panel.setAttribute('aria-modal','true');panel.setAttribute('aria-label','Controls');
      panel.innerHTML=`<div class="in"><h2>CONTROLS</h2><p>Click an action, then press the key you want for it. A key already in use swaps over. Esc cancels.</p>
        <div class="rows"></div>
        <div class="fixed"><b>Mouse</b><span>look and aim · left click fire · right click aim (guns in flight) · middle click Zeal</span><b>Arrows</b><span>also move</span><b>Esc / P</b><span>pause</span></div>
        <div class="msg" aria-live="polite"></div>
        <div class="bar"><button type="button" data-k="reset">Reset all</button><button type="button" class="primary" data-k="done">Done</button></div></div>`;
      for(const ev of['pointerdown','touchstart','mousedown'])panel.addEventListener(ev,e=>e.stopPropagation(),{passive:true});
      panel.addEventListener('click',e=>{e.stopPropagation();const b=e.target.closest('button');if(!b)return;const msg=panel.querySelector('.msg');
        if(b.dataset.k==='done'){close();return;}
        if(b.dataset.k==='reset'){reset();draw();msg.textContent='Back to the default keys.';return;}
        const d=b.dataset.d;if(!d)return;draw();const nb=panel.querySelector(`[data-d="${d}"]`);nb.classList.add('wait');nb.textContent='press a key';msg.textContent='';
        capture=c=>{capture=null;if(c==='Escape'){draw();return;}
          if(RESERVED.has(c)){draw();msg.textContent=name(c)+' is kept for pause and menus.';return;}
          const was=ACTIONS.find(([o])=>o!==d&&code(o)===c);bind(d,c);draw();
          msg.textContent=was?`${name(c)} moved from ${was[1]}; ${was[1]} is on ${name(code(was[0]))} now.`:'';
          const f=panel.querySelector(`[data-d="${d}"]`);if(f)f.focus();};});
      document.body.appendChild(panel);}
    draw();panel.querySelector('.msg').textContent='';panel.hidden=false;const f=panel.querySelector('.row button');if(f)f.focus({preventScroll:true});}
  function close(){if(!panel)return;capture=null;panel.hidden=true;const f=onClose;onClose=null;if(f)f();}
  return{ACTIONS,code,name,bind,reset,label,open,close,onChange:f=>hooks.push(f),get map(){return Object.assign({},map);},get isOpen(){return!!(panel&&!panel.hidden);}};
})();

const TOUCHLAYOUT=(()=>{
  const SEL=['#fire','#ads','#nade','#shld','#jump','#crch','#rld','#wpn','#use','#zeal','#msl','#boost','#up','#down','#gun','#attack','.dogboost','.dogmsl'];
  const LS='elyra.touch.v1';
  let all={};try{all=JSON.parse(localStorage.getItem(LS)||'{}')||{};}catch(_){all={};}
  const fam=()=>document.getElementById('shld')?'foot':(location.pathname.split('/').pop()||'index').replace(/\.html$/,'')+((new URLSearchParams(location.search).get('part')==='streets')?'-streets':'');
  const cur=()=>all[fam()]||(all[fam()]={});
  const st=document.createElement('style');
  function apply(){const L=all[fam()]||{};let t='';
    for(const s in L){const v=L[s];if(!v)continue;t+=`${s}{translate:${(v.x*100).toFixed(2)}vw ${(v.y*100).toFixed(2)}vh;scale:${(v.s||1).toFixed(3)}}\n`;}
    st.textContent=t+EDIT_CSS;if(!st.parentNode&&document.head)document.head.appendChild(st);}
  const EDIT_CSS=`
body.tl-edit .tl-ctl[hidden]{display:var(--tl-d,grid)!important}
body.tl-edit .tl-ctl{visibility:visible!important;opacity:1!important;pointer-events:none!important;z-index:86!important}
body.tl-edit .tl-ctl.tl-sel{outline:2px dashed #ffd27a;outline-offset:4px}
.tl{position:fixed;inset:0;z-index:85;background:rgba(0,0,0,.35);touch-action:none}
.tl-bar{position:fixed;left:50%;top:calc(env(safe-area-inset-top,0px) + 8px);transform:translateX(-50%);z-index:87;display:flex;align-items:center;gap:8px;flex-wrap:wrap;justify-content:center;
  padding:8px 10px;background:rgba(6,10,22,.92);border:1px solid rgba(140,200,255,.32);border-radius:4px;color:#eef4ff;font:700 11px 'Chakra Petch','Arial Narrow',sans-serif;letter-spacing:.12em;max-width:calc(100vw - 20px)}
.tl-bar b{color:#ffd27a;min-width:64px;text-align:center}
.tl-bar input{width:120px;accent-color:#7fe3ff}
.tl-bar button{padding:8px 11px;border-radius:3px;border:1px solid rgba(140,200,255,.4);background:rgba(20,34,60,.8);color:#eef4ff;font:700 11px 'Chakra Petch','Arial Narrow',sans-serif;letter-spacing:.14em;text-transform:uppercase}
.tl-bar button.primary{background:#2d6fd6;border-color:#5aa0ff}`;
  if(document.head)apply();else addEventListener('DOMContentLoaded',apply,{once:true});
  function save(){try{localStorage.setItem(LS,JSON.stringify(all));}catch(_){}}
  const selOf=el=>{if(el.id&&SEL.includes('#'+el.id))return'#'+el.id;for(const s of SEL)if(s[0]==='.'&&el.matches(s))return s;return null;};
  const nice={'#fire':'FIRE','#ads':'AIM','#nade':'NADE','#shld':'GEAR','#jump':'JUMP','#crch':'CROUCH','#rld':'RELOAD','#wpn':'SWAP','#use':'USE','#zeal':'ZEAL','#msl':'MISSILE','#boost':'BOOST','#up':'UP','#down':'DOWN','#gun':'GUN','#attack':'ATTACK','.dogboost':'BOOST','.dogmsl':'MISSILE'};
  let ov=null,bar=null,els=[],sel=null,drag=null,done=null;
  function edit(onDone){done=onDone||null;apply();
    els=[];for(const s of SEL)document.querySelectorAll(s).forEach(e=>{if(!els.includes(e))els.push(e);});
    for(const e of els){const h=e.hidden;e.hidden=false;e.style.setProperty('--tl-d',getComputedStyle(e).display==='none'?'grid':getComputedStyle(e).display);e.hidden=h;e.classList.add('tl-ctl');}
    document.body.classList.add('tl-edit');
    ov=document.createElement('div');ov.className='tl';
    bar=document.createElement('div');bar.className='tl-bar';
    bar.innerHTML=`<span>DRAG A BUTTON</span><b>—</b><label>SIZE <input type="range" min="60" max="170" step="5" value="100" aria-label="Button size" disabled></label><button type="button" data-t="one" disabled>Reset it</button><button type="button" data-t="all">Reset all</button><button type="button" class="primary" data-t="done">Done</button>`;
    document.body.append(ov,bar);
    for(const ev of['pointerdown','touchstart','mousedown','click'])bar.addEventListener(ev,e=>e.stopPropagation());
    const L=cur(),pick=s=>{sel=s;els.forEach(e=>e.classList.toggle('tl-sel',selOf(e)===s));const r=bar.querySelector('input'),one=bar.querySelector('[data-t=one]');
      bar.querySelector('b').textContent=s?nice[s]||s:'—';r.disabled=one.disabled=!s;if(s)r.value=Math.round(((L[s]&&L[s].s)||1)*100);};
    ov.addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation();let hit=null;
      for(let i=els.length-1;i>=0;i--){const el=els[i],r=el.getBoundingClientRect();if(r.width&&e.clientX>=r.left-6&&e.clientX<=r.right+6&&e.clientY>=r.top-6&&e.clientY<=r.bottom+6){hit=el;break;}}
      const s=hit&&selOf(hit);pick(s);if(!s)return;const v=L[s]||(L[s]={x:0,y:0,s:1});drag={id:e.pointerId,x:e.clientX,y:e.clientY,v0:{x:v.x,y:v.y},v};try{ov.setPointerCapture(e.pointerId);}catch(_){}});
    ov.addEventListener('pointermove',e=>{if(!drag||e.pointerId!==drag.id)return;e.preventDefault();
      drag.v.x=drag.v0.x+(e.clientX-drag.x)/innerWidth;drag.v.y=drag.v0.y+(e.clientY-drag.y)/innerHeight;apply();});
    const up=e=>{if(drag&&e.pointerId===drag.id){drag=null;save();}};ov.addEventListener('pointerup',up);ov.addEventListener('pointercancel',up);
    bar.querySelector('input').addEventListener('input',e=>{if(!sel)return;const v=L[sel]||(L[sel]={x:0,y:0,s:1});v.s=e.target.value/100;apply();save();});
    bar.addEventListener('click',e=>{const b=e.target.closest('[data-t]');if(!b)return;
      if(b.dataset.t==='one'&&sel){delete L[sel];apply();save();pick(sel);}
      else if(b.dataset.t==='all'){for(const k in L)delete L[k];apply();save();pick(null);}
      else if(b.dataset.t==='done')stop();});
    pick(null);}
  function stop(){document.body.classList.remove('tl-edit');els.forEach(e=>e.classList.remove('tl-ctl','tl-sel'));els=[];if(ov)ov.remove();if(bar)bar.remove();ov=bar=null;drag=null;save();
    const f=done;done=null;if(f)f();}
  return{edit,stop,apply,get family(){return fam();}};
})();
