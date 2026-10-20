/* No-zoom guard for iOS Safari.
   Safari ignores user-scalable=no and only partly honors touch-action, so a fast double-tap on the
   canvas or HUD triggers its double-tap zoom, and the game's own touch handling then blocks the
   pinch that would undo it. Four layers:
   1. viewport meta pinned to scale 1
   2. touch-action:manipulation as a zero-specificity fallback (page rules still win)
   3. eat the second tap of a double-tap, plus Safari's gesture (pinch) events and dblclick
   4. if the page somehow ends up zoomed anyway, snap it back to 1 */
(function(){
  'use strict';
  var BASE = 'width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover';
  var meta = document.querySelector('meta[name=viewport]');
  if(!meta){ meta = document.createElement('meta'); meta.name = 'viewport'; document.head.appendChild(meta); }
  meta.setAttribute('content', BASE);

  var st = document.createElement('style');
  st.textContent = ':where(html,body,*){touch-action:manipulation}';
  document.head.appendChild(st);

  function editable(el){
    return el && el.closest && el.closest('input,textarea,select,[contenteditable=""],[contenteditable=true]');
  }

  // Double-tap: cancel the second touchend if it lands within 350ms of the last one.
  var lastEnd = 0;
  document.addEventListener('touchend', function(e){
    var now = Date.now();
    if(now - lastEnd < 350 && e.changedTouches.length === 1 && !editable(e.target) && e.cancelable){
      e.preventDefault();
      // preventDefault also swallows the tap's click, so fire it ourselves; quick double-taps on
      // menu, dialogue and pause buttons still register both taps
      var t = e.target;
      if(t && typeof t.click === 'function') t.click();
    }
    lastEnd = now;
  }, {passive:false, capture:true});

  // Pinch-zoom gestures (Safari-only events)
  ['gesturestart','gesturechange','gestureend'].forEach(function(t){
    document.addEventListener(t, function(e){ e.preventDefault(); }, {passive:false});
  });
  document.addEventListener('dblclick', function(e){ if(!editable(e.target)) e.preventDefault(); }, {passive:false});

  // Recovery: Safari re-applies the viewport when the meta content changes, which resets the scale.
  var vv = window.visualViewport;
  function unzoom(){
    if(!vv || vv.scale <= 1.01) return;
    meta.setAttribute('content', BASE.replace('initial-scale=1', 'initial-scale=0.99'));
    setTimeout(function(){ meta.setAttribute('content', BASE); window.scrollTo(0, window.scrollY); }, 30);
  }
  if(vv){ vv.addEventListener('resize', unzoom); }
  window.addEventListener('orientationchange', function(){ setTimeout(unzoom, 300); });
})();
