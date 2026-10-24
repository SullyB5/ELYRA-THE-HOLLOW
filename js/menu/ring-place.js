/* RING PLACE · keeps the two sonar rings off the card stack, on PC and on phones (Oct 23).
   The stack's shape changes with the screen (card width, fanned back cards, rotation), so the rings are placed by looking at
   where the cards actually are: each ring is tested against the real, transformed cards (elementsFromPoint) and moved into
   the clear space beside them.
     PC: the reticle's own rings (#hotL/#hotR and their drawn circles) slide outward along the reticle's middle line until
         they clear the stack, and never further in than where the reticle draws them.
     Phones/tablets (the touch rings #sonarL/#sonarR): placed in the open strip either side of the stack, as close to the
         card's middle as they fit; both at the same height when there is a height where both fit. */
(()=>{
  const $=id=>document.getElementById(id);
  const center=document.querySelector('.center'),stack=document.querySelector('.stack'),svg=document.querySelector('.reticle');
  if(!center||!stack)return;
  const cards=()=>[...stack.querySelectorAll('.card')].filter(c=>c.offsetParent);
  /* each card as its four real corners (its rotation, scale and offset from the computed transform), worked out from the
     layout rather than hit-testing, so it is right even while the stack is scrolled off screen */
  let Q=[];
  function quads(){const S=stack.getBoundingClientRect(),cx=S.left+S.width/2,cy=S.top+S.height/2;Q=[];
    for(const c of cards()){const w=c.offsetWidth/2,h=c.offsetHeight/2;if(!w)continue;
      const t=getComputedStyle(c).transform,m=t&&t!=='none'?new DOMMatrixReadOnly(t):new DOMMatrixReadOnly();
      Q.push([[-w,-h],[w,-h],[w,h],[-w,h]].map(([x,y])=>[cx+m.a*x+m.c*y+m.e,cy+m.b*x+m.d*y+m.f]));}}
  function bounds(){quads();if(!Q.length)return null;const xs=Q.flat().map(p=>p[0]),ys=Q.flat().map(p=>p[1]);
    return {l:Math.min(...xs),r:Math.max(...xs),t:Math.min(...ys),b:Math.max(...ys)};}
  /* the stack's edge along one row: where that row first meets a card coming in from that side, or null if it misses them all */
  function edge(y,side){let e=null;
    for(const q of Q)for(let i=0;i<4;i++){const [x1,y1]=q[i],[x2,y2]=q[(i+1)%4];if((y1-y)*(y2-y)>0||y1===y2)continue;
      const x=x1+(x2-x1)*(y-y1)/(y2-y1);e=e===null?x:side==='l'?Math.min(e,x):Math.max(e,x);}return e;}
  /* the tightest edge across a band of rows (a ring's height) */
  function bandEdge(yc,h,side,B){let e=side==='l'?Infinity:-Infinity;
    for(const f of[-1,-.7,-.35,0,.35,.7,1]){const v=edge(yc+f*h/2,side);if(v!==null)e=side==='l'?Math.min(e,v):Math.max(e,v);}return e;}

  function placeReticle(B){if(!svg)return;const m=svg.getScreenCTM();if(!m)return;const k=m.a,gap=8;
    for(const [side,id,deco,cx0] of[['l','hotL','ringDecoL',200],['r','hotR','ringDecoR',600]]){
      const X0=m.e+cx0*k,Y0=m.f+350*k,R=26*k,e=bandEdge(Y0,2*R,side,B);
      let X=side==='l'?Math.min(X0,e-gap-R):Math.max(X0,e+gap+R);
      X=Math.max(m.e+30*k,Math.min(m.e+770*k,X));                       // stay within the reticle
      const dx=(X-X0)/k;$(id).setAttribute('cx',cx0+dx);const d=$(deco);if(d)d.setAttribute('transform','translate('+dx.toFixed(1)+' 0)');}
    /* the "2237" tags beside the reticle step aside for a ring that has moved onto them */
    for(const y of center.querySelectorAll('.yr')){y.style.visibility='';const r=y.getBoundingClientRect();if(!r.width)continue;
      for(const id of['hotL','hotR']){const c=$(id).getBoundingClientRect();if(c.right>r.left-4&&c.left<r.right+4&&c.bottom>r.top-4&&c.top<r.bottom+4)y.style.visibility='hidden';}}}

  /* is a ring (centre x,y, radius r) clear of every card, with a small margin? */
  const inQuad=(q,x,y)=>{let s=0;for(let i=0;i<4;i++){const [x1,y1]=q[i],[x2,y2]=q[(i+1)%4],c=(x2-x1)*(y-y1)-(y2-y1)*(x-x1);if(c){if(s&&Math.sign(c)!==s)return false;s=Math.sign(c);}}return true;};
  function clearOfCards(x,y,r){for(const q of Q){if(inQuad(q,x,y))return false;
    for(let a=0;a<16;a++)if(inQuad(q,x+Math.cos(a*.3927)*r,y+Math.sin(a*.3927)*r))return false;}return true;}
  function placeSonar(B){const L=$('sonarL'),Rr=$('sonarR');if(!L||!Rr)return;
    const front=stack.querySelector('.card[data-pos="0"]')||cards()[0];if(!front)return;
    const F=front.getBoundingClientRect(),C=center.getBoundingClientRect(),vw=document.documentElement.clientWidth,pad=3,hug=12;
    // beside the stack: the ring sits just off the card edge (hug), never past the screen edge
    const fit=(yc,s,side)=>{const e=bandEdge(yc,s+6,side,B);
      if(side==='l'){const lim=e===Infinity?F.left:e;const x=Math.max(pad+s/2,lim-hug-s/2);return x+s/2<=lim-4?x:null;}
      const lim=e===-Infinity?F.right:e;const x=Math.min(vw-pad-s/2,lim+hug+s/2);return x-s/2>=lim+4?x:null;};
    const mid=F.top+F.height*.55,span=F.height/2-26;let best=null;
    for(const s of[44,38,32]){
      for(let o=0;o<=span&&!best;o+=4)for(const y of o?[mid+o,mid-o]:[mid]){const l=fit(y,s,'l'),r=fit(y,s,'r');if(l!==null&&r!==null){best={s,yl:y,yr:y,l,r};break;}}
      if(best)break;}
    if(!best){/* no room beside the stack at one height (a narrow column): each ring takes the nearest clear spot to its side of
         the card, avoiding the cards, the file text and the arc buttons under the stack */
      const s=32,r=s/2+4,obst=[...center.querySelectorAll('.meta,.arcnav,.yr')].filter(e=>e.offsetParent).map(e=>e.getBoundingClientRect());
      const free=(x,y)=>clearOfCards(x,y,r)&&!obst.some(o=>x+r>o.left&&x-r<o.right&&y+r>o.top&&y-r<o.bottom);
      const x0=Math.max(pad+s/2,C.left-16),x1=Math.min(vw-pad-s/2,C.right+16),y0=B.t-90,y1=F.bottom+10;
      const near=(px,py,other)=>{let bst=null,bd=1e9;for(let y=y0;y<=y1;y+=4)for(let x=x0;x<=x1;x+=4){
          if(other&&Math.hypot(x-other[0],y-other[1])<s+12)continue;const d=Math.hypot(x-px,(y-py)*.8);if(d<bd&&free(x,y)){bd=d;bst=[x,y];}}return bst;};
      const l=near(F.left,mid),rr=near(F.right,mid,l);if(!l||!rr)return;best={s,l:l[0],yl:l[1],r:rr[0],yr:rr[1]};}
    for(const [el,x,y] of[[L,best.l,best.yl],[Rr,best.r,best.yr]]){
      Object.assign(el.style,{width:best.s+'px',height:best.s+'px',right:'auto',left:(x-best.s/2-C.left)+'px',top:(y-best.s/2-C.top)+'px'});}}

  let busy=false;
  function place(){busy=false;const B=bounds();if(!B)return;
    const touch=$('sonarL')&&getComputedStyle($('sonarL')).display!=='none';
    if(touch)placeSonar(B);else placeReticle(B);}
  let t=0;const later=(ms=560)=>{clearTimeout(t);t=setTimeout(()=>{if(!busy){busy=true;requestAnimationFrame(place);}},ms);};   // after the cards' .5s transition
  addEventListener('resize',()=>later(200));addEventListener('orientationchange',()=>later(400));addEventListener('load',()=>later(100));
  new MutationObserver(()=>later()).observe(stack,{subtree:true,childList:true,attributes:true,attributeFilter:['data-pos','class','style','href']});
  if(window.ResizeObserver)new ResizeObserver(()=>later(200)).observe(center);
  later(300);
})();
