/* Elyra · the prologue. Plays before The Mountain's command deck (in the campaign and in Archive 01 on its own):
   who the Remnant are, what Elyra is, the Keepers, the Codex, the Hollow King, the theft, and the Pathfinder.
   Ten painted shots drawn on one canvas in code, narrated by Master Elias Veyr through the shared radio voices (sfx.speak).
   PROLOGUE.play(done) · Skip button, Enter or Esc skip it. Every line is in PROLOGUE.LINES (and in SCRIPT.md). */
const PROLOGUE=(()=>{
const VW=1600,VH=900,still=matchMedia('(prefers-reduced-motion: reduce)').matches;
const st=document.createElement('style');st.textContent=`
#prol{position:fixed;inset:0;z-index:60;background:#000}#prol canvas{position:absolute;inset:0;width:100%;height:100%}
#prol .psub{position:absolute;left:50%;bottom:calc(env(safe-area-inset-bottom,0px) + 7vh);transform:translateX(-50%);width:min(900px,88vw);text-align:center;opacity:0;transition:opacity .3s;
  font:500 17px/1.5 'Chakra Petch','Arial Narrow',system-ui,sans-serif;letter-spacing:.03em;color:#eef0f4;text-shadow:0 1px 4px #000,0 0 2px #000}
#prol .psub.on{opacity:1}#prol .psub b{display:block;font:600 10px 'JetBrains Mono',ui-monospace,monospace;letter-spacing:.26em;color:rgba(217,178,90,.9);text-transform:uppercase;margin-bottom:3px}
#prol .ptitle{position:absolute;inset:0;display:grid;place-items:center;align-content:center;text-align:center;opacity:0;transition:opacity 1.4s;pointer-events:none;padding:0 6vw;
  font:500 clamp(22px,4.4vw,48px)/1.25 'Chakra Petch','Arial Narrow',sans-serif;letter-spacing:.42em;color:#e6e4df}
#prol .ptitle small{display:block;margin-top:14px;font:400 11px 'JetBrains Mono',monospace;letter-spacing:.3em;color:rgba(230,228,223,.5)}
#prol .ptitle.on{opacity:1}#prol .ptitle.sm{font-size:clamp(12px,1.6vw,15px);letter-spacing:.32em;color:rgba(230,228,223,.75)}
#prol .pskip{position:absolute;right:calc(env(safe-area-inset-right,0px) + 16px);bottom:calc(env(safe-area-inset-bottom,0px) + 14px);padding:8px 14px;border:1px solid rgba(230,228,223,.3);border-radius:3px;
  background:rgba(0,0,0,.5);color:rgba(230,228,223,.8);font:700 11px 'Chakra Petch',sans-serif;letter-spacing:.2em;text-transform:uppercase;cursor:pointer}
@media (max-width:760px){#prol .psub{font-size:15px;bottom:calc(env(safe-area-inset-bottom,0px) + 10vh)}}`;
document.head.appendChild(st);

/* ---------- the narration ---------- */
const E='Elias Veyr',M='Lt. Michael';
const LINES={
  earth:[[E,'Before Elyra, there was Earth. We call its end the Great Collapse. The Archive does not say what caused it.']],
  arks:[[E,'Nine arks left the dying world. Three arrived. Everyone alive on Elyra is descended from those three.'],[E,'We call ourselves the Remnant.']],
  elyra:[[E,'Elyra was waiting for us. An ocean. Air we could breathe. And on the shore, a city of white stone that no human hand had built.']],
  city:[[E,'We built Tide City in its shadow, around the Spear. We teach our children that we found this world by chance.'],[E,'The Archive does not use that word.']],
  keepers:[[E,'The Keepers keep the Remnant. We hold the city, we fly the fleet, and we guard the Archive: everything humanity ever knew, and everything it chose to forget.'],
    [M,'Lieutenant Michael Veyr, Interceptor Wing. When the Keepers go somewhere they shouldn’t, I go first.']],
  codex:[[E,'The heart of the Archive is the Codex. Every jump route between our colonies is written in it. Without it, every ship we have flies blind.']],
  king:[[E,'South of the city are the old mountains, where nothing grows. Something lives there that calls itself the Hollow King.'],[E,'His Empty Host do not speak. They do not stop.']],
  theft:[[E,'Three nights ago he walked into the Archive, past every Keeper on watch, and walked out with the Codex.']],
  pathfinder:[[E,'We sent the Pathfinder after him. Captain Rhen and forty-one crew, the fastest ship we had. She followed his trail into the dark, to a world called Astraea.']],
  silence:[[E,'Three days later, she sent us one message.'],[E,'Then nothing.']],
};

/* ---------- stage ---------- */
let root,cv,c,subEl,titleEl,W,H,DPR,SC,S=null,R=null,raf=0,last=0;
function mount(){root=document.createElement('div');root.id='prol';root.setAttribute('role','dialog');root.setAttribute('aria-label','Prologue');
  root.innerHTML='<canvas></canvas><div class="psub" aria-live="polite"><b></b><span></span></div><div class="ptitle"></div><button class="pskip" type="button">Skip ›</button>';
  document.body.appendChild(root);cv=root.querySelector('canvas');c=cv.getContext('2d');subEl=root.querySelector('.psub');titleEl=root.querySelector('.ptitle');
  root.querySelector('.pskip').addEventListener('click',skip);resize();addEventListener('resize',resize);}
function resize(){if(!cv)return;DPR=Math.min(devicePixelRatio||1,2);W=innerWidth;H=innerHeight;cv.width=Math.round(W*DPR);cv.height=Math.round(H*DPR);SC=Math.max(Math.min(W/VW,H/VH),Math.min(H/VH,W/1000));}
function rng(seed){let s=seed>>>0;return()=>{s+=0x6D2B79F5;let t=s;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296;};}
const GR=document.createElement('canvas');GR.width=GR.height=160;{const g=GR.getContext('2d'),d=g.createImageData(160,160);for(let i=0;i<d.data.length;i+=4){const v=Math.random()*255;d.data[i]=d.data[i+1]=d.data[i+2]=v;d.data[i+3]=Math.random()<.5?255:0;}g.putImageData(d,0,0);}
let grain=null;
const STARS=(()=>{const r=rng(11);return Array.from({length:260},()=>[r()*1700-50,r()*1000-50,r()]);})();
function stars(dx,a){for(const s of STARS){const x=((s[0]+dx*s[2])%1700+1700)%1700-50;c.fillStyle=`rgba(225,230,245,${(.15+.6*s[2])*(a==null?1:a)})`;c.fillRect(x,s[1],1.3+s[2]*1.4,1.3+s[2]*1.4);}}
const lerp=(a,b,u)=>a+(b-a)*u,sm=u=>u<=0?0:u>=1?1:u*u*(3-2*u);
function glowAt(x,y,r,col){const g=c.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,col);g.addColorStop(1,'rgba(0,0,0,0)');c.fillStyle=g;c.fillRect(x-r,y-r,r*2,r*2);}

/* ---------- the shots. Each draws the 1600×900 frame for time t (seconds into the shot) ---------- */
function planet(x,y,r,t,o){c.save();c.beginPath();c.arc(x,y,r,0,7);c.clip();
  let g=c.createRadialGradient(x-r*.35,y-r*.35,r*.1,x,y,r);g.addColorStop(0,o.a);g.addColorStop(.7,o.b);g.addColorStop(1,o.c);c.fillStyle=g;c.fillRect(x-r,y-r,r*2,r*2);
  if(o.bands){c.globalAlpha=.1;c.strokeStyle=o.bands;for(let i=-6;i<=6;i++){c.lineWidth=r*.035*(1+(i*7%3));c.beginPath();c.moveTo(x-r,y+i*r*.14+Math.sin(t*.2+i)*4);c.bezierCurveTo(x-r*.3,y+i*r*.14-12,x+r*.3,y+i*r*.14+14,x+r,y+i*r*.14);c.stroke();}c.globalAlpha=1;}
  if(o.land){c.fillStyle=o.land;const r2=rng(o.seed||3);for(let i=0;i<9;i++){const a=r2()*7,d=r2()*r*.8,s=r*(.12+r2()*.25);c.beginPath();c.ellipse(x+Math.cos(a+t*.03)*d,y+Math.sin(a)*d*.7,s,s*.6,r2()*3,0,7);c.fill();}}
  if(o.fn)o.fn(x,y,r);
  // night side
  g=c.createLinearGradient(x-r,y-r,x+r,y+r);g.addColorStop(0,'rgba(0,0,0,0)');g.addColorStop(.6,'rgba(0,0,0,.08)');g.addColorStop(1,'rgba(0,0,0,.85)');c.fillStyle=g;c.fillRect(x-r,y-r,r*2,r*2);c.restore();
  c.save();c.globalCompositeOperation='lighter';c.strokeStyle=o.rim;c.lineWidth=r*.025;c.beginPath();c.arc(x,y,r,Math.PI*.75,Math.PI*1.75);c.stroke();c.restore();}
const SHOT={
  earth(t){c.fillStyle='#010103';c.fillRect(0,0,VW,VH);stars(-t*3,.8);const k=sm(t/9),r=300;
    planet(800,470,r,t,{a:'#5d8fb0',b:'#2a4f6e',c:'#0c1a28',land:'#3f5a3a',seed:7,rim:'rgba(140,190,255,.55)',fn:(x,y,R)=>{
      // the fissures: orange cracks opening across it, and the lights going out
      const r2=rng(41);c.strokeStyle=`rgba(255,${120-60*k|0},40,${.25+.65*k})`;c.lineWidth=2.5;c.shadowColor='rgba(255,100,30,.9)';c.shadowBlur=12*k;
      for(let i=0;i<14;i++){let px=x+(r2()-.5)*R*1.4,py=y+(r2()-.5)*R*1.2;c.beginPath();c.moveTo(px,py);const n=Math.floor(3+k*6);for(let j=0;j<n;j++){px+=(r2()-.5)*70;py+=(r2()-.5)*50;c.lineTo(px,py);}c.stroke();}
      c.shadowBlur=0;c.fillStyle=`rgba(40,20,20,${.45*k})`;c.fillRect(x-R,y-R,R*2,R*2);}});
    c.save();c.globalCompositeOperation='lighter';glowAt(800,470,420,`rgba(255,90,40,${.12*k})`);c.restore();},
  arks(t){c.fillStyle='#010103';c.fillRect(0,0,VW,VH);stars(-t*14,1);
    // nine long ships crossing; six of them fall dark and drift away
    const r2=rng(9);for(let i=0;i<9;i++){const y=200+i*62+r2()*30,sp=24+r2()*10,x=-300+((t*sp+i*170)%2000),s=.6+r2()*.6,lost=i%3!==1,dark=lost?sm((t-2-i*.6)/2.5):0;
      c.save();c.translate(x,y+dark*t*4);c.rotate(dark*.2);c.scale(s,s);c.globalAlpha=1-dark*.7;
      c.fillStyle='#0b0d12';c.beginPath();c.moveTo(-160,-10);c.lineTo(120,-14);c.lineTo(170,0);c.lineTo(120,14);c.lineTo(-160,10);c.closePath();c.fill();
      c.fillRect(-120,-24,60,48);c.fillRect(-20,-20,40,40);c.strokeStyle='rgba(200,215,240,.25)';c.lineWidth=1.5;c.strokeRect(-120,-24,60,48);
      c.globalCompositeOperation='lighter';if(!dark||dark<.9){glowAt(-170,0,46*(1-dark),'rgba(120,180,255,.7)');c.fillStyle=`rgba(255,220,160,${.8*(1-dark)})`;for(let k=0;k<7;k++)c.fillRect(-100+k*30,-4,3,3);}
      c.restore();}},
  elyra(t){c.fillStyle='#010103';c.fillRect(0,0,VW,VH);stars(-t*2,.9);const r=330,x=820+t*4,y=500;
    planet(x,y,r,t,{a:'#4fb4c8',b:'#1d5f8a',c:'#081a2c',bands:'rgba(255,255,255,.9)',rim:'rgba(160,230,255,.7)',fn:(X,Y,R)=>{
      c.fillStyle='rgba(225,210,170,.85)';c.beginPath();c.ellipse(X-R*.25,Y+R*.05,R*.16,R*.07,.6,0,7);c.fill();
      c.save();c.globalCompositeOperation='lighter';const p=.6+.4*Math.sin(t*2.2);glowAt(X-R*.3,Y,18+10*p,`rgba(255,215,120,${.9})`);c.restore();}});
    c.save();c.globalCompositeOperation='lighter';glowAt(x,y,r*1.25,'rgba(80,170,255,.12)');c.restore();},
  city(t){let g=c.createLinearGradient(0,0,0,600);g.addColorStop(0,'#141a33');g.addColorStop(.6,'#6b3e52');g.addColorStop(1,'#e08a5a');c.fillStyle=g;c.fillRect(0,0,VW,600);
    stars(0,.35);glowAt(1150,560,260,'rgba(255,190,120,.45)');
    // the Spear of Destiny over the bay
    const sx=980;c.fillStyle='#e9e4d6';c.beginPath();c.moveTo(sx-16,560);c.lineTo(sx-5,120);c.lineTo(sx,70);c.lineTo(sx+5,120);c.lineTo(sx+16,560);c.fill();
    c.fillStyle='rgba(0,0,0,.25)';c.beginPath();c.moveTo(sx,70);c.lineTo(sx+5,120);c.lineTo(sx+16,560);c.lineTo(sx,560);c.fill();
    c.save();c.globalCompositeOperation='lighter';glowAt(sx,78,60+8*Math.sin(t*1.5),'rgba(255,215,140,.9)');c.restore();
    // white stone ruins (old, not ours) and the city around them
    const r2=rng(23);for(let i=0;i<46;i++){const x=r2()*1700-50,w=20+r2()*60,h=40+r2()*200*(1-Math.abs(x-sx)/1400);c.fillStyle=i%5===0?'#d7d0c0':'#232232';c.fillRect(x,560-h,w,h);
      if(i%5){c.fillStyle='rgba(255,214,140,.7)';for(let k=0;k<6;k++)if(r2()<.6)c.fillRect(x+4+(k%2)*(w-10),560-h+8+((k/2)|0)*16,3,3);}}
    g=c.createLinearGradient(0,560,0,900);g.addColorStop(0,'#3a2a3c');g.addColorStop(1,'#0c0c16');c.fillStyle=g;c.fillRect(0,560,VW,340);
    c.strokeStyle='rgba(255,200,140,.18)';c.lineWidth=2;for(let y=575;y<900;y+=14){const o=Math.sin(t+y)*20;c.beginPath();c.moveTo(1000+o,y);c.lineTo(1300+o,y);c.stroke();}
    c.fillStyle='rgba(255,220,160,.12)';c.fillRect(sx-6,560,12,340);},
  keepers(t){c.fillStyle='#07080c';c.fillRect(0,0,VW,VH);let g=c.createRadialGradient(800,300,0,800,300,900);g.addColorStop(0,'rgba(60,90,140,.35)');g.addColorStop(1,'rgba(0,0,0,0)');c.fillStyle=g;c.fillRect(0,0,VW,VH);
    // the emblem behind them
    c.strokeStyle='rgba(217,178,90,.35)';c.lineWidth=3;c.beginPath();c.arc(800,300,180,0,7);c.stroke();c.beginPath();c.arc(800,300,120,0,7);c.stroke();
    c.beginPath();for(const a of[0,Math.PI/2,Math.PI/4,-Math.PI/4]){c.moveTo(800+Math.cos(a)*180,300+Math.sin(a)*180);c.lineTo(800-Math.cos(a)*180,300-Math.sin(a)*180);}c.stroke();
    // ships passing overhead
    for(let i=0;i<3;i++){const x=-200+((t*90+i*600)%2000),y=120+i*40;c.fillStyle='#10131a';c.beginPath();c.moveTo(x,y);c.lineTo(x-60,y-8);c.lineTo(x-70,y);c.lineTo(x-60,y+8);c.fill();c.save();c.globalCompositeOperation='lighter';glowAt(x-72,y,16,'rgba(140,230,255,.8)');c.restore();}
    // a line of Keepers; the one in front is Michael
    for(let i=-4;i<=4;i++){const x=800+i*150,s=i?.8-Math.abs(i)*.04:1.05,y=840;keeper(x,y,s,i===0?1:.6);}},
  codex(t){c.fillStyle='#050406';c.fillRect(0,0,VW,VH);
    c.fillStyle='rgba(217,178,90,.06)';for(let i=0;i<12;i++){c.fillRect(100+i*125,0,6,VH);}   // the vault's ribs
    let g=c.createLinearGradient(800,0,800,700);g.addColorStop(0,'rgba(255,220,150,.0)');g.addColorStop(1,'rgba(255,220,150,.22)');c.fillStyle=g;c.beginPath();c.moveTo(740,0);c.lineTo(860,0);c.lineTo(990,700);c.lineTo(610,700);c.fill();
    c.fillStyle='#1b1712';c.fillRect(690,640,220,260);c.fillStyle='#2a241a';c.fillRect(670,630,260,20);
    // the Codex: a slow-turning gold lattice
    const a=t*.5;c.save();c.translate(800,470);c.globalCompositeOperation='lighter';glowAt(0,0,220,'rgba(255,200,110,.35)');
    c.strokeStyle='rgba(255,225,150,.9)';c.lineWidth=2.5;for(let i=0;i<6;i++){const k=Math.cos(a+i*Math.PI/6);c.beginPath();c.ellipse(0,0,Math.abs(110*k),110,0,0,7);c.stroke();}
    c.beginPath();c.ellipse(0,0,110,22,0,0,7);c.stroke();c.fillStyle='rgba(255,240,200,.9)';c.beginPath();c.arc(0,0,10+3*Math.sin(t*3),0,7);c.fill();c.restore();},
  king(t){let g=c.createLinearGradient(0,0,0,VH);g.addColorStop(0,'#0c0614');g.addColorStop(.6,'#3a1a44');g.addColorStop(1,'#120a16');c.fillStyle=g;c.fillRect(0,0,VW,VH);
    c.save();c.globalCompositeOperation='lighter';glowAt(800,420,520,'rgba(160,80,230,.25)');c.restore();
    // the old mountains
    c.fillStyle='#160c1c';c.beginPath();c.moveTo(0,620);const r2=rng(5);for(let x=0;x<=VW;x+=60)c.lineTo(x,380+Math.abs(Math.sin(x*.004))*-180+r2()*90+(Math.abs(x-800)<200?-120:0));c.lineTo(VW,VH);c.lineTo(0,VH);c.fill();
    // the Empty Host, rank on rank, and him in front
    for(let row=0;row<4;row++)for(let i=-10;i<=10;i++){if(Math.abs(i)<2&&row===0)continue;const x=800+i*(70-row*8)+(row%2)*30,y=770-row*42,s=.55-row*.08;trooper(x,y,s);}
    const rise=sm(t/4);c.save();c.translate(800,860+40*(1-rise));c.scale(1.5,1.5);c.fillStyle='#06030a';
    c.beginPath();c.moveTo(-60,0);c.lineTo(-38,-170);c.lineTo(-56,-210);c.lineTo(-30,-250);c.lineTo(30,-250);c.lineTo(56,-210);c.lineTo(38,-170);c.lineTo(60,0);c.fill();
    c.beginPath();c.arc(0,-272,20,0,7);c.fill();for(const k of[-16,-6,6,16]){c.beginPath();c.moveTo(k-5,-286);c.lineTo(k,-318-(Math.abs(k)<10?10:0));c.lineTo(k+5,-286);c.fill();}
    c.globalCompositeOperation='lighter';glowAt(-7,-274,7,'rgba(220,170,255,.9)');glowAt(7,-274,7,'rgba(220,170,255,.9)');c.restore();},
  theft(t){c.fillStyle='#050406';c.fillRect(0,0,VW,VH);c.fillStyle='rgba(217,178,90,.04)';for(let i=0;i<12;i++)c.fillRect(100+i*125,0,6,VH);
    // the plinth, empty; purple light through the broken door; helmets on the floor
    c.save();c.globalCompositeOperation='lighter';const fl=.7+.3*Math.sin(t*9)*Math.sin(t*3.3);glowAt(250,450,520,`rgba(150,70,220,${.35*fl})`);c.restore();
    c.fillStyle='#0d0a10';c.beginPath();c.moveTo(150,900);c.lineTo(150,180);c.lineTo(330,160);c.lineTo(330,900);c.fill();c.fillStyle='rgba(170,110,240,.5)';c.beginPath();c.moveTo(190,900);c.lineTo(230,200);c.lineTo(260,210);c.lineTo(240,900);c.fill();
    c.fillStyle='#1b1712';c.fillRect(690,640,220,260);c.fillStyle='#2a241a';c.fillRect(670,630,260,20);
    c.strokeStyle='rgba(255,225,150,.2)';c.setLineDash([6,8]);c.beginPath();c.ellipse(800,470,110,110,0,0,7);c.stroke();c.setLineDash([]);
    for(const[x,y,a]of[[520,820,.3],[1080,850,-.6],[1260,800,1.2]]){c.save();c.translate(x,y);c.rotate(a);c.fillStyle='#d8dde4';c.beginPath();c.ellipse(0,0,34,26,0,0,7);c.fill();c.fillStyle='#284c78';c.fillRect(-26,-6,52,10);c.restore();}},
  pathfinder(t){c.fillStyle='#010103';c.fillRect(0,0,VW,VH);stars(-t*40,1);
    planet(1360,250,120,t,{a:'#c8603a',b:'#6a2018',c:'#200806',bands:'rgba(255,140,90,.6)',rim:'rgba(255,120,80,.6)'});
    // the Pathfinder: sleek, white and gold, then the jump streak
    const jump=sm((t-6)/1.2),x=lerp(500,560,t/7)+jump*1400,y=lerp(560,530,t/7)-jump*350;c.save();c.translate(x,y);c.rotate(-.24);
    if(jump>0){c.globalCompositeOperation='lighter';const g=c.createLinearGradient(-900*jump,0,0,0);g.addColorStop(0,'rgba(140,220,255,0)');g.addColorStop(1,'rgba(200,240,255,.9)');c.fillStyle=g;c.fillRect(-900*jump,-6,900*jump,12);c.globalCompositeOperation='source-over';}
    c.fillStyle='#e8ebef';c.beginPath();c.moveTo(150,0);c.lineTo(-90,-26);c.lineTo(-120,-10);c.lineTo(-120,10);c.lineTo(-90,26);c.closePath();c.fill();c.fillStyle='#d9b25a';c.fillRect(-60,-3,150,6);
    c.fillStyle='#9aa3ae';c.beginPath();c.moveTo(-40,-22);c.lineTo(-110,-60);c.lineTo(-90,-20);c.fill();c.beginPath();c.moveTo(-40,22);c.lineTo(-110,60);c.lineTo(-90,20);c.fill();
    c.globalCompositeOperation='lighter';glowAt(-126,0,40,'rgba(140,230,255,.9)');c.restore();},
  silence(t){c.fillStyle='#030303';c.fillRect(0,0,VW,VH);
    // a waveform that breaks up into static
    const br=sm((t-3)/2);c.strokeStyle=`rgba(255,110,80,${.8-br*.4})`;c.lineWidth=2.5;c.beginPath();for(let x=200;x<=1400;x+=4){const n=Math.sin(x*.05+t*8)*Math.sin(x*.013-t*2)*80*(1-br)+(Math.random()-.5)*160*br;x===200?c.moveTo(x,450+n):c.lineTo(x,450+n);}c.stroke();
    c.font='600 22px "JetBrains Mono",monospace';c.fillStyle='rgba(255,120,90,.8)';c.textAlign='center';c.fillText('PATHFINDER · KEEPER SCOUT · CPT. A. RHEN',800,300);
    c.fillStyle=`rgba(255,120,90,${br>.5?(Math.sin(t*6)>0?.9:.2):.0})`;c.fillText('SIGNAL LOST',800,640);c.textAlign='left';},
};
function keeper(x,y,s,lit){c.save();c.translate(x,y);c.scale(s,s);c.fillStyle='#0a0c10';c.shadowColor=`rgba(140,190,255,${.6*lit})`;c.shadowBlur=14;
  c.beginPath();c.moveTo(-34,0);c.lineTo(-30,-150);c.lineTo(-50,-160);c.lineTo(-46,-250);c.lineTo(46,-250);c.lineTo(50,-160);c.lineTo(30,-150);c.lineTo(34,0);c.fill();
  c.beginPath();c.ellipse(-52,-238,24,16,-.3,0,7);c.ellipse(52,-238,24,16,.3,0,7);c.fill();c.beginPath();c.arc(0,-282,26,0,7);c.fill();c.shadowBlur=0;
  c.fillStyle=`rgba(127,227,255,${.85*lit})`;c.fillRect(-14,-288,28,5);c.fillStyle=`rgba(217,178,90,${.8*lit})`;c.fillRect(-46,-206,92,4);c.fillStyle=`rgba(230,235,240,${.25*lit})`;c.fillRect(-44,-246,88,10);c.restore();}
function trooper(x,y,s){c.save();c.translate(x,y);c.scale(s,s);c.fillStyle='#08040c';c.beginPath();c.moveTo(-30,0);c.lineTo(-26,-150);c.lineTo(-44,-240);c.lineTo(44,-240);c.lineTo(26,-150);c.lineTo(30,0);c.fill();
  c.beginPath();c.arc(0,-266,22,0,7);c.fill();c.globalCompositeOperation='lighter';c.fillStyle='rgba(190,120,255,.8)';c.fillRect(-12,-270,24,4);c.restore();}

/* ---------- the running order ---------- */
const ORDER=[['earth',1.2,'Before Elyra'],['arks',.8],['elyra',.8],['city',.8],['keepers',.8],['codex',.8],['king',.8],['theft',.8],['pathfinder',1.6],['silence',1.2]];
const ABORT={};
const chk=()=>{if(!R||R.dead)throw ABORT;};
const wait=s=>Promise.race([new Promise(r=>setTimeout(r,s*1000)),R.skipP]).then(chk);
function sub(who,text){if(!who){subEl.classList.remove('on');return;}subEl.querySelector('b').textContent=who==='Lt. Michael'?'Lt. Michael Veyr':who==='Elias Veyr'?'Master Elias Veyr':who;subEl.querySelector('span').textContent=text;subEl.classList.add('on');}
// one line: spoken through the shared radio voices when there are any, else held for its reading time
function line(who,text){chk();sub(who,text);return Promise.race([new Promise(res=>{
  if(typeof sfx!=='undefined'&&sfx.speak){const h=sfx.speak(who,text,null);const p=()=>{if(h.done||!R||R.dead)return res();setTimeout(p,120);};
    setTimeout(()=>{if(!h.voiced)setTimeout(res,h.est*1000);else p();},200);}
  else setTimeout(res,(text.split(/\s+/).length/2.5+.6)*1000);}),R.skipP]).then(()=>{chk();sub(null);});}
async function card(html,cls,hold){titleEl.className='ptitle'+(cls?' '+cls:'');titleEl.innerHTML=html;await wait(.05);titleEl.classList.add('on');await wait(hold);titleEl.classList.remove('on');await wait(1.4);}
async function run(){
  S={shot:null,t:0,fade:1};
  await wait(.6);
  for(const[id,beat,small]of ORDER){S.shot=id;S.t=0;
    if(small){await card(small,'sm',2.2);}
    S.fadeTo=0;await wait(1.1);
    if(id==='silence'&&typeof sfx!=='undefined'&&sfx.static)setTimeout(()=>{if(R&&!R.dead)sfx.static(1.6);},4200);
    for(const[who,text]of LINES[id]){await line(who,text);await wait(.35);}
    await wait(beat);S.fadeTo=1;await wait(1);}
  S.shot=null;await card('ELYRA: THE HOLLOW<small>THE KEEPERS OF THE REMNANT</small>','',3.4);
}
function frame(now){if(!R){raf=0;return;}raf=requestAnimationFrame(frame);const dt=Math.min(.05,(now-(last||now))/1000);last=now;if(!S)return;S.t+=dt;
  if(S.fadeTo!=null)S.fade+=(S.fadeTo-S.fade)*(1-Math.exp(-dt*3));
  c.setTransform(1,0,0,1,0,0);c.fillStyle='#000';c.fillRect(0,0,cv.width,cv.height);
  if(S.shot){const k=SC*(1+(still?0:S.t*.006)),ox=W/2-800*k,oy=H/2-450*k;c.setTransform(DPR*k,0,0,DPR*k,DPR*ox,DPR*oy);SHOT[S.shot](S.t);c.setTransform(1,0,0,1,0,0);
    if(!grain)grain=c.createPattern(GR,'repeat');c.save();c.globalAlpha=.06;c.translate(Math.random()*160,Math.random()*160);c.fillStyle=grain;c.fillRect(-160,-160,cv.width+160,cv.height+160);c.restore();
    const vg=c.createRadialGradient(cv.width/2,cv.height/2,cv.height*.3,cv.width/2,cv.height/2,Math.max(cv.width,cv.height)*.75);vg.addColorStop(0,'rgba(0,0,0,0)');vg.addColorStop(1,'rgba(0,0,0,.75)');c.fillStyle=vg;c.fillRect(0,0,cv.width,cv.height);}
  const bandH=Math.min(H,VH*SC),bar=(H-bandH)/2+bandH*.07;c.fillStyle='#000';c.fillRect(0,0,cv.width,bar*DPR);c.fillRect(0,(H-bar)*DPR,cv.width,bar*DPR);
  if(S.fade>.002){c.fillStyle=`rgba(0,0,0,${Math.min(1,S.fade)})`;c.fillRect(0,0,cv.width,cv.height);}}
function skip(){if(!R||R.dead)return;R.dead=true;R.skipRes();if(typeof sfx!=='undefined'&&sfx.hush)sfx.hush();}
const key=e=>{if(!R)return;if(e.key==='Enter'||e.key==='Escape'){e.preventDefault();e.stopPropagation();skip();}};
async function play(done){
  if(!root)mount();root.hidden=false;R={dead:false};R.skipP=new Promise(r=>R.skipRes=r);last=0;if(!raf)raf=requestAnimationFrame(frame);addEventListener('keydown',key,true);
  try{await run();}catch(e){if(e!==ABORT)console.error(e);}
  removeEventListener('keydown',key,true);if(typeof sfx!=='undefined'&&sfx.hush)sfx.hush();sub(null);
  root.style.transition='opacity .8s';root.style.opacity='0';const r=R;R=null;S=null;
  setTimeout(()=>{root.hidden=true;root.style.opacity='';root.style.transition='';},850);
  if(done)done(r&&r.dead);}
return{play,LINES};
})();
