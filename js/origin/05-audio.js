/* Elyra · Origin — audio glue: the shared synth (js/shared/audio.js) with this chapter's events. Distances here are metres. */
(()=>{
  // the line shows when its voice starts (lines queue rather than talk over each other), and stays up as long as it takes to say
  PG.say=(s=>function(who,text,tone,dur){return sfx.speak(who,text,H=>{sfx.radio();s(who,text,tone,Math.max(dur||0,H.est+1.5));});})(PG.say);
  sfx.blast=p=>sfx.explosion(p,1200);
  sfx.mountButton($('views'),$('quality'));
  addEventListener('pointerdown',()=>{},{once:true});
})();
