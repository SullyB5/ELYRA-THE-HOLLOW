/* Astraea · audio glue: the shared synth (js/shared/audio.js) plus this chapter's own events and loops. */
(()=>{
  const _say=say;say=function(who,txt,dur,tone){return sfx.speak(who,txt,H=>{sfx.radio();_say(who,txt,Math.max(dur||0,H.est+1.5));},tone);};
  const _hp=hurtPlayer;hurtPlayer=function(dmg,at,exact){const sh=P.shield,live=P.alive&&P.zealT<=0;_hp(dmg,at,exact);if(live)sfx.hit(sh>=dmg);};
  const _pd=playerDown;playerDown=function(){sfx.shipDown();return _pd();};
  const _uz=useZeal;useZeal=function(){const ok=P.zeal>=100&&P.zealT<=0&&P.alive;_uz();if(ok)sfx.zeal();};
  const _wk=wake;wake=function(){sfx.wake();return _wk();};
  const _sw=startWave;startWave=function(i){sfx.alarm();return _sw(i);};
  // Sound sits under the Chapters link
  const b=sfx.mountButton(document.body,null,'menu snd');b.style.cursor='pointer';
  const st=document.createElement('style');st.textContent='.menu.snd{top:calc(env(safe-area-inset-top,0px) + 112px)}@media (pointer:coarse){.menu.snd{top:calc(env(safe-area-inset-top,0px) + 78px)!important;right:calc(env(safe-area-inset-right,0px) + 120px)!important}}';
  document.head.appendChild(st);
  let jumped=false;
  const _uh=updateHUD;updateHUD=function(dt){_uh(dt);
    const sp=P.alive?P.vel.length():0;sfx.engine(sp/820,sp>600,P.alive&&!PG.paused);
    sfx.drone('zeal',220,P.zealT>0?.05:0,'triangle');                       // Zeal burning: a bright, singing tone
    sfx.drone('beam',62,beamMat.opacity*.3,'sawtooth',600);                   // the planet's beam on the Covenant
    sfx.drone('planet',34+Math.min(1,planetU.uLight.value)*10,phase==='intro'?0:.03); // the woken planet, a low presence under everything
    if(phase==='jump'&&!jumped){jumped=true;sfx.jump(camera.position);}
    if(P.alive&&P.hull<30){const n=performance.now();if(n-(updateHUD.al||0)>4000){updateHUD.al=n;sfx.alarm();}}   // low hull: a warning every few seconds, not a constant ping
  };
})();
