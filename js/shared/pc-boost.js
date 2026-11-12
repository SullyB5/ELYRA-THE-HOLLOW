/* PC graphics boost (Nov 11 2026, Bryce: "the graphics on PC can be increased, the phone needs to stay like it is now").
   Loaded last on every level page. Does nothing on phones/tablets (coarse pointer or a mobile browser) and nothing on
   Quality: low. On a PC with Quality: high it adds, on top of what each level already sets up:
     1. textures: 16x anisotropic filtering (was 8x) on every texture in the scene, so ground and walls stay sharp at a slant
     2. shadows: the sun/key light's shadow map 4096 px (was 2048), crisper shadow edges
     3. resolution: renders above the screen's own resolution (supersampling, up to 1.5x) for cleaner edges, one step at a
        time, but only while the frame rate holds; if it sags it steps back down and stays there for the level. */
(function () {
  const UA = navigator.userAgent || '';
  if (matchMedia('(pointer: coarse)').matches || /iPhone|iPad|iPod|Android|Mobile/i.test(UA)) return;
  const R = () => (typeof renderer !== 'undefined' ? renderer : null);
  const S = () => (typeof scene !== 'undefined' ? scene : null);
  const hq = () => (typeof HQ === 'undefined' ? true : !!HQ);

  /* 1 + 2: textures and shadows, swept a few times while the level streams its models in, then every few seconds */
  const done = new WeakSet(), SLOTS = ['map', 'normalMap', 'roughnessMap', 'metalnessMap', 'aoMap', 'emissiveMap', 'bumpMap', 'alphaMap', 'specularMap'];
  function sweep() {
    const r = R(), s = S(); if (!r || !s || !hq()) return;
    const maxA = Math.min(16, (r.capabilities.getMaxAnisotropy && r.capabilities.getMaxAnisotropy()) || 1);
    const big = Math.min(4096, r.capabilities.maxTextureSize || 4096);
    s.traverse(o => {
      if (o.isDirectionalLight && o.castShadow && o.shadow && o.shadow.mapSize.x < big && o.shadow.mapSize.x >= 2048) {
        o.shadow.mapSize.set(big, big); if (o.shadow.map) { o.shadow.map.dispose(); o.shadow.map = null; }
      }
      if (!o.material) return;
      for (const m of [].concat(o.material)) {
        if (!m) continue;
        for (const k of SLOTS) { const t = m[k]; if (t && t.isTexture && !done.has(t) && t.image) { done.add(t); if (t.anisotropy < maxA) { t.anisotropy = maxA; t.needsUpdate = true; } } }
      }
    });
  }
  [1500, 4000, 9000, 16000].forEach(t => setTimeout(sweep, t));
  setInterval(sweep, 6000);

  /* 3: supersampling, only with headroom. Each level sizes its composer from renderer.getPixelRatio() in its resize
     handler, so a step is setPixelRatio + a resize event. Quality: low / the level's own setQuality are left alone. */
  const base = () => Math.min(devicePixelRatio || 1, 1.75), CAP = 1.5;
  let mine = null, locked = false, frames = 0, t0 = performance.now(), wait = 6;   // first look after ~6 s, once the level settles
  function apply(pr) { const r = R(); if (!r) return; r.setPixelRatio(pr); mine = pr; dispatchEvent(new Event('resize')); }
  function tick(now) {
    requestAnimationFrame(tick);
    if (document.hidden) { frames = 0; t0 = now; return; }
    frames++; const el = (now - t0) / 1000; if (el < 2) return;
    const fps = frames / el; frames = 0; t0 = now;
    const r = R(); if (!r || !hq()) { mine = null; return; }
    const cur = r.getPixelRatio();
    if (mine !== null && Math.abs(cur - mine) > .01) { mine = null; locked = false; wait = 3; }   // the level changed it (quality toggle): start over
    if (wait > 0) { wait -= 2; return; }
    if (fps < 50 && cur > base() + .01) { apply(Math.max(base(), cur - .25)); locked = true; wait = 4; return; }   // sagging: back off, stay there
    if (!locked && fps >= 57 && cur < CAP - .01 && cur >= base() - .01) { apply(Math.min(CAP, cur + .25)); wait = 4; }
  }
  requestAnimationFrame(tick);
})();
