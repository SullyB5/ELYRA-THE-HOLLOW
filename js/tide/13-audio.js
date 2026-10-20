/* Tide City · audio glue: the shared synth (js/shared/audio.js) plus this chapter's own events and loops. */
(()=>{
  // the line shows when its voice starts (lines queue rather than talk over each other), and stays up as long as it takes to say
  PG.say=(s=>function(who,text,tone,dur){return sfx.speak(who,text,H=>{sfx.radio();s(who,text,tone,Math.max(dur||0,H.est+1.5));},tone);})(PG.say);
  const _lm=launchMissile;launchMissile=function(from,dir,target,big){if(target)sfx.missile(from,big);return _lm(from,dir,target,big);};
  const _sc=startCrash;startCrash=function(c,guide){if(!c.crash)sfx.crash(c.grp.position);return _sc(c,guide);};
  const _do=dropOut;dropOut=function(){sfx.jump(camera.position);return _do();};
  const _ld=launchDrop;launchDrop=function(){_ld();const D=drops.find(D=>D.state==='in'&&D.t===0);if(D)sfx.horn(D.pos);};
  const _ht=hurtTide;hurtTide=function(dmg,at){const sh=tideP.shield;_ht(dmg,at);if(tideP.alive&&mode==='pilot'&&FIGHT.has(PH[ph].id))sfx.hit(sh>=dmg);};
  const _td=tideDown;tideDown=function(){sfx.shipDown();return _td();};
  sfx.mountButton($('views'),$('quality'));
  const _tt=tideTick;tideTick=function(dt){_tt(dt);
    const pil=mode==='pilot',sp=pil?vel.length():0;sfx.engine(sp/650,sp>420,pil);
    // shield hum, louder the closer you are to the dome
    const sOn=shield.visible?Math.min(1,shieldMat.uniforms.uOp.value):0,sd=Math.max(0,1-Math.abs(camera.position.length()-SHIELD_R)/2500);
    sfx.drone('shield',55,sOn*(.05+.1*sd));
    // the Spear: a rising drone while it charges
    const ch=PH[ph].id==='spear'&&!spearFired()?spearCharge():0;sfx.drone('spear',45+ch*190,ch>0?.02+ch*.09:0,'sawtooth',900);
    if(pil&&tideP.alive&&tideP.hull<30)sfx.alarm();
  };
})();
