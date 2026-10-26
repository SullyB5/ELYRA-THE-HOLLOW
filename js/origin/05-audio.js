/* Elyra · Origin — audio glue: the shared synth (js/shared/audio.js) with this chapter's events. Distances here are metres. */
(()=>{
  // the line shows when its voice starts (lines queue rather than talk over each other), and stays up as long as it takes to say
  PG.say=(s=>function(who,text,tone,dur){return sfx.speak(who,text,H=>{sfx.radio();s(who,text,tone,Math.max(dur||0,H.est+1.5));},tone);})(PG.say);
  sfx.blast=p=>sfx.explosion(p,1200);
  sfx.mountButton($('views'),$('quality'));
  addEventListener('pointerdown',()=>{},{once:true});
  // indoors (a chapter sets window.INDOOR_AT to say how far the camera is inside: tunnels, halls, the tower): a light room reverb
  const room=()=>{requestAnimationFrame(room);let k=0;try{if(typeof window.INDOOR_AT==='function')k=+window.INDOOR_AT()||0;}catch(_){}sfx.indoor(k);};
  requestAnimationFrame(room);
})();
