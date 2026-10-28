// testing only: per-frame timing of the game's own functions and of the renderer, and what got uploaded to the GPU that frame.
// Use from an .acts line: 0|(()=>{eval(INSTR_SRC)...})  — or paste via probe --pre. Results in window.__F (frames over __F.min ms).
(()=>{if(window.__I)return 'already';
  const W={};window.__I=W;const names=(window.__INAMES||'spawnTrooper,launchDrop,addTurret,boom,blast,director,updateEnemies,updateAllies,updateDrops,updateTurrets,renderFrame,stepPlayer,blowGate,cutPower,collapseRoof,startHold,gunshipScene,endingScene,makeGunship,makeDropship,addPick,hurtEnemy,updateBolts,updateBooms,updateHud,updateLights,PG.say,PG.objective,banner,rearWave,vaultStart,squadFollow,markFoes,updateWp,SETS.update,CUTS.update,VEH.update,updateRockets,updateNades,fire,separate').split(',');
  const get=p=>p.split('.').reduce((o,k)=>o&&o[k],window),setp=(p,v)=>{const ks=p.split('.'),l=ks.pop();const o=ks.reduce((o,k)=>o&&o[k],window);if(o)o[l]=v;};
  for(const n of names){const f=get(n);if(typeof f!=='function')continue;
    const wf=function(){const t0=performance.now();try{return f.apply(this,arguments);}finally{const d=performance.now()-t0;const r=W[n]||(W[n]={ms:0,n:0,max:0,fr:0});r.ms+=d;r.n++;r.fr+=d;if(d>r.max)r.max=d;}};
    try{setp(n,wf);}catch(e){}}
  const F=window.__F={min:window.__FMIN||120,list:[],last:performance.now(),prev:null};
  const info=()=>{const i=renderer.info;return{p:i.programs?i.programs.length:0,t:i.memory.textures,g:i.memory.geometries};};
  F.prev=info();
  const tick=now=>{requestAnimationFrame(tick);const d=now-F.last;F.last=now;const cur=info(),fr={};
    for(const n in W){if(W[n].fr>1)fr[n]=Math.round(W[n].fr);W[n].fr=0;}
    const ph=typeof phase!=='undefined'?phase:'';
    if(d>F.min||cur.p!==F.prev.p||cur.t!==F.prev.t+0&&cur.t-F.prev.t>0)F.list.push({at:Math.round(now),d:Math.round(d),ph,dp:cur.p-F.prev.p,dt:cur.t-F.prev.t,dg:cur.g-F.prev.g,fr});
    F.prev=cur;};
  requestAnimationFrame(tick);return 'instr '+Object.keys(W).length;})()
