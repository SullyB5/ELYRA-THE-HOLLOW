/* Elyra · Origin — audio glue: the shared synth (js/shared/audio.js) with this chapter's events. Distances here are metres. */
(()=>{
  PG.say=(s=>function(who,text,tone,dur){s(who,text,tone,dur);sfx.radio();sfx.speak(who,text);})(PG.say);
  sfx.blast=p=>sfx.explosion(p,1200);
  sfx.mountButton($('views'),$('quality'));
  addEventListener('pointerdown',()=>{},{once:true});
})();
