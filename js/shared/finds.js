/* Elyra shared · FIND: the hidden things in a level (Nov 10, Bryce, with his new prop batch, js/shared/furnish.js):
     mural   a Remnant carving (the glyph-panel) and its stone beast (the statue) set off the main path, one per level. Walk up to it and
             whoever is with you reads it: each one hints at the Heralds who were not lost, and what they wanted from us
     log     a footage log, one per level: a data pad (smartphone) or a field recorder (cinema-camera) dropped where someone fell.
             Walk over it to take it; its recording plays as subtitles
     cache   a Remnant Marks cache, one per level, hidden: the blue supply capsule (treasure-chest, scaled down). Walk up to it: its
             marks are yours (PG.grant), once
   Each level lists its own with FIND.add({...}) (positions found with FURN.auto, off the way through). What you've found is kept
   in this browser (localStorage elyra.finds): a log or cache taken stays gone, a mural reads once a visit.
   (The lines are Claude's drafts for Bryce to rewrite.) */
const FIND=(()=>{
  let got={};try{got=JSON.parse(localStorage.getItem('elyra.finds')||'{}')||{};}catch(_){}
  const save=()=>{try{localStorage.setItem('elyra.finds',JSON.stringify(got));}catch(_){}};
  const L=[];const page=(location.pathname.split('/').pop()||'').replace('.html','');
  const R={mural:4.2,log:1.6,cache:2.6};
  function glowSp(hex,s){if(typeof glow==='undefined')return null;const g=new THREE.Sprite(new THREE.SpriteMaterial({map:glow,color:new THREE.Color(hex).multiplyScalar(1.6),blending:THREE.AdditiveBlending,depthWrite:false,transparent:true,opacity:.55,toneMapped:false}));g.scale.setScalar(s);return g;}
  function add(o){o=Object.assign({},o);o.id=o.id||page+':'+o.kind;if(o.y==null)o.y=typeof FURN!=='undefined'&&FURN.floor?FURN.floor(o.x,o.z):typeof groundY==='function'?groundY(o.x,o.z):0;o.done=!!got[o.id]&&o.kind!=='mural';
    const G=new THREE.Group();G.position.set(o.x,o.y,o.z);G.rotation.y=o.ry||0;G.visible=!o.done;(o.parent||scene).add(G);o.G=G;
    if(o.kind==='mural'){
      // (Nov 10, Bryce, on the first test shot: the tablet stood on the dust like a fresh white sign and the beast was a black blob)
      // old stone: the tablet greyed toward the level's rock and leaning back, sunk to its knees in the ground; the beast lit from within a little
      const tone=(m,c,k)=>m.traverse(q=>{if(!q.isMesh)return;q.material=q.material.clone();const M=q.material;if(c)M.color.multiply(new THREE.Color(c));M.roughness=Math.max(M.roughness,.9);
        if(k&&M.map){M.emissive=new THREE.Color(k,k*.95,k*.9);M.emissiveMap=M.map;}M.needsUpdate=true;});
      FURN.obj('glyph-panel').then(m=>{tone(m,o.tint||0x8a8278,.06);m.scale.setScalar(o.s||.8);m.position.set(0,-.35,0);m.rotation.set(-.16,0,.04);G.add(m);}).catch(()=>{});
      if(o.statue!==false)FURN.obj('statue').then(m=>{tone(m,0xc8c0b4,.28);m.scale.setScalar(o.ss||.42);m.position.set(o.sx!=null?o.sx:2.6,-.1,o.sz!=null?o.sz:.9);m.rotation.y=o.sry!=null?o.sry:-.5;G.add(m);}).catch(()=>{});
      const g=glowSp(0xffd890,2.4);if(g){g.position.set(0,1.2,.9);g.material.opacity=.1;G.add(g);}
      if(typeof OBST!=='undefined')OBST.push({x:o.x,z:o.z,r:1.4,h:3,ghost:true});}
    else if(o.kind==='log'){const f=o.f||'smartphone',k=f==='cinema-camera'?2.4:3;
      FURN.obj(f).then(m=>{m.scale.setScalar(k);m.rotation.set(f==='smartphone'?-.2:0,.6,0);m.position.y=.05;G.add(m);}).catch(()=>{});
      const g=glowSp(0x9fe4ff,1.1);if(g){g.position.y=.35;G.add(g);o.halo=g;}}
    else if(o.kind==='cache'){FURN.obj('treasure-chest').then(m=>{m.scale.setScalar(o.s||.36);G.add(m);}).catch(()=>{});
      const g=glowSp(0x7fb4ff,2.4);if(g){g.position.y=.6;G.add(g);o.halo=g;}
      if(typeof OBST!=='undefined')OBST.push({x:o.x,z:o.z,r:.9,h:1,ghost:true});}
    L.push(o);return o;}
  function talk(lines){let t=0;for(const [w,x,d] of lines){setTimeout(()=>{if(typeof PG!=='undefined'&&PG.say)PG.say(w,x,'lore',6);},t*1000);t+=d||4.2;}}
  const note=s=>{if(typeof banner==='function')banner(s);};
  function hit(o){if(o.kind==='mural'){o.done=true;if(!got[o.id]){got[o.id]=1;save();}talk(o.lines||[]);return;}
    o.done=true;got[o.id]=Date.now();save();o.G.visible=false;if(typeof sfx!=='undefined'&&sfx.beep)sfx.beep();
    if(o.kind==='log'){note('Footage log recovered · '+(o.title||'')); talk(o.lines||[]);}
    else{const n=o.marks||50;if(typeof PG!=='undefined'&&PG.grant)PG.grant(n,'Remnant cache · '+(o.where||page));note('Remnant cache · +'+n+' marks');}}
  let last=performance.now(),T=0;
  function tick(now){requestAnimationFrame(tick);const dt=Math.min(.1,(now-last)/1000);last=now;T+=dt;
    if(typeof P==='undefined'||!P||!P.pos||!L.length)return;if(typeof CUTS!=='undefined'&&CUTS.on)return;
    for(const o of L){if(o.halo&&!o.done){o.halo.material.opacity=.35+.25*Math.sin(T*2.4+o.x);}
      if(o.done||!P.alive)continue;const d=Math.hypot(P.pos.x-o.x,P.pos.z-o.z);if(d<R[o.kind]&&Math.abs(P.pos.y-o.y)<3)hit(o);}}
  requestAnimationFrame(tick);
  return{add,get all(){return L;},got:()=>Object.assign({},got),count:kind=>Object.keys(got).filter(k=>!kind||k.endsWith(':'+kind)).length};})();
