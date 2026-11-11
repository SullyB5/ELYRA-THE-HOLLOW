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

/* ---------- The screen size on iPhone (Nov 10 2026) ----------
   Bryce, on iPhone: every level and cutscene drew into only part of the screen (the left half in cutscenes, ~85% in play, the rest
   the page's background colour), and the first landscape load came up stretched for a while. Cause: iOS hands a page that opens in
   landscape the wrong innerWidth/innerHeight (the portrait ones, or the size with the toolbars) for a while after it loads, and the
   levels call renderer.setSize(innerWidth, innerHeight) on load, which also writes that wrong size into the canvas's inline style.
   The finishing pass resizes with updateStyle off after that, so the canvas kept the wrong box for the whole level.
   1. the full-screen canvases always fill their box (the inline size can no longer shrink them)
   2. on touch devices innerWidth/innerHeight report the real size of the screen as laid out (a fixed full-screen probe), re-measured
      on every resize/rotation and checked twice a second; when it changes, a resize event goes out so every scene re-sizes itself
   ---------- Graphics memory (Nov 10 2026) ----------
   Bryce: crashes the first time the footage plays, leaving level 5, and the first time Rainveil and Fallen Spire start. iOS kills a
   tab that runs out of memory, and a level that's leaving (or the menu behind a level that's loading) still holds all its GPU memory
   until iOS lets it go. So the moment a page starts to leave, its WebGL contexts are let go. A page brought back from the back/forward
   cache with them gone reloads; a context the system takes away mid-play shows a reload button instead of a frozen screen. */
(function(){
  'use strict';
  var st=document.createElement('style');
  st.textContent='#app>canvas,canvas#bg{width:100%!important;height:100%!important}';
  (document.head||document.documentElement).appendChild(st);

  var touch=false;try{touch=matchMedia('(pointer:coarse)').matches;}catch(_){}
  if(touch){
    var desc=function(k){return Object.getOwnPropertyDescriptor(window,k)||(window.Window&&Object.getOwnPropertyDescriptor(Window.prototype,k));};
    var dW=desc('innerWidth'),dH=desc('innerHeight');
    var nW=function(){return dW&&dW.get?dW.get.call(window):document.documentElement.clientWidth;};
    var nH=function(){return dH&&dH.get?dH.get.call(window):document.documentElement.clientHeight;};
    var probe=document.createElement('div');probe.setAttribute('aria-hidden','true');
    probe.style.cssText='position:fixed;left:0;top:0;right:0;bottom:0;visibility:hidden;pointer-events:none;z-index:-1';
    document.documentElement.appendChild(probe);
    var W=0,H=0;
    function measure(){var r=probe.getBoundingClientRect(),w=Math.round(r.width),h=Math.round(r.height);
      if(w>0&&h>0){var c=w!==W||h!==H;W=w;H=h;return c;}return false;}
    measure();
    try{
      Object.defineProperty(window,'innerWidth',{configurable:true,get:function(){return W||nW();}});
      Object.defineProperty(window,'innerHeight',{configurable:true,get:function(){return H||nH();}});
    }catch(_){}
    var sending=false;
    function check(){if(sending)return;if(measure()){sending=true;try{window.dispatchEvent(new Event('resize'));}finally{sending=false;}}}
    // first in line on every resize, so the handlers after it read the real size
    window.addEventListener('resize',function(){if(!sending)measure();});
    var soon=function(){[60,250,600,1200,2500].forEach(function(t){setTimeout(check,t);});};
    window.addEventListener('orientationchange',soon);
    if(window.visualViewport)window.visualViewport.addEventListener('resize',soon);
    window.addEventListener('pageshow',soon);
    document.addEventListener('DOMContentLoaded',soon);window.addEventListener('load',soon);
    setInterval(check,500);
  }

  // every WebGL context the page makes
  var GLS=[],leaving=false;
  var gc=HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext=function(type){var ctx=gc.apply(this,arguments);
    if(ctx&&/webgl/i.test(String(type))&&GLS.indexOf(ctx)<0){GLS.push(ctx);
      this.addEventListener('webglcontextlost',function(){if(!leaving)setTimeout(lost,400);});}
    return ctx;};
  function letGo(){if(leaving)return;leaving=true;
    for(var i=0;i<GLS.length;i++){try{var x=GLS[i].getExtension('WEBGL_lose_context');if(x)x.loseContext();}catch(_){}}}
  window.addEventListener('beforeunload',letGo);
  window.addEventListener('pagehide',letGo);
  window.ELYRA_LEAVE=letGo;
  window.ELYRA_GO=function(u){letGo();location.href=u;};
  // links to another page of the game (the pause menu's way back to the menu, and the like)
  document.addEventListener('click',function(e){var a=e.target&&e.target.closest&&e.target.closest('a[href]');
    if(!a||e.defaultPrevented||a.target==='_blank'||a.hasAttribute('download'))return;
    var h=a.getAttribute('href')||'';if(!h||h[0]==='#'||/^(mailto|tel|javascript):/i.test(h)||a.origin!==location.origin)return;
    setTimeout(function(){if(!e.defaultPrevented)letGo();},0);},true);   // (js/shared/progress.js calls it when a level hands on to the next)
  window.addEventListener('pageshow',function(e){if(e.persisted&&leaving)location.reload();});
  function lost(){if(leaving||document.getElementById('glLost'))return;
    var d=document.createElement('div');d.id='glLost';
    d.style.cssText='position:fixed;inset:0;z-index:100000;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;background:rgba(3,5,10,.92);color:#eef4ff;font:600 15px system-ui,sans-serif;text-align:center;padding:24px';
    d.innerHTML='<div>The phone ran out of graphics memory.</div><button type="button" style="font:700 15px system-ui;padding:12px 22px;border-radius:6px;border:1px solid #7fe3ff;background:#0d2230;color:#eef4ff">Reload</button>';
    d.querySelector('button').addEventListener('click',function(){location.reload();});
    (document.body||document.documentElement).appendChild(d);}
})();
