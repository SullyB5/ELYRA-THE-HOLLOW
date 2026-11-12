/* Elyra · performance layer (Nov 12 2026, Bryce: "optimize the entire game for performance while keeping its current visual quality").
   Loaded last on every level page (it takes over from js/shared/pc-boost.js). Nothing here changes what a level builds; it only stops
   the renderer drawing what can't be seen and picks lighter copies of what is too far away for the difference to show.

   1. Graphics presets (Settings → Graphics): Performance / Balanced / Quality, stored in localStorage elyra.preset.
      Phones start on Balanced, PCs on Quality. Performance is the old "Quality: low" (no finishing pass, lower resolution).
   2. Adaptive resolution: the render resolution moves inside the preset's range to hold the frame rate, a step at a time, and a step
      down that didn't help is undone (the GPU wasn't the problem, e.g. iOS Low Power Mode's 30 fps cap). On a PC with Quality it also
      supersamples above the screen's resolution while the frame rate holds (what pc-boost.js did).
   3. Culling: three.js only frustum-culls by a mesh's own geometry bounds, so every instanced set (rocks, props, crowds) and every
      skinned character was drawn even behind the camera (they had culling switched off because those bounds were wrong). Each gets the
      right bounds here (all its instances / where its bones are now), so it is culled again, in the shadow pass too. Lit, non-glowing
      meshes smaller than about half a pixel on screen are skipped as well (they can't show; big things and landmarks never are).
   4. Automatic LOD: every indexed mesh over 2000 triangles gets lighter copies made in a worker (meshoptimizer's simplifier, on the
      same vertex buffers, so only a new index list is stored). Each frame the lightest copy whose worst error is under the preset's
      pixel budget (0.6 px on Quality) is drawn, so the change is never visible and nothing pops: a landmark that is big on screen keeps
      full detail however far it is. The original stays on the mesh for everything else (raycasts, collisions).
   5. GPU memory (phones): geometry and textures (over 256 KB) that have been out of every scene for five minutes (finished cutscene sets, removed enemies) are released
      from the GPU; three.js uploads them again by itself if they come back.
   6. Monitor: Settings → Performance stats (or F8 on PC, or ?perf in the address): FPS, 1% low, frame time, draw calls, triangles,
      GPU memory estimate, render scale, LOD and culling counts, load time and bytes downloaded. ELYRA_PERF.report() returns the same. */
(function () {
  if (typeof THREE === 'undefined' || window.ELYRA_PERF) return;
  const UA = navigator.userAgent || '';
  const PHONE = matchMedia('(pointer: coarse)').matches || /iPhone|iPad|iPod|Android|Mobile/i.test(UA);
  const GR = () => { try { return window.ELYRA_RENDERER || (typeof renderer !== 'undefined' ? renderer : null); } catch (_) { return null; } };
  const nowMs = () => performance.now();

  /* ---------- presets ---------- */
  const PRESETS = {
    performance: { label: 'Performance', hq: false, cullPx: 1.0, lodPx: 2.0, res: [0.6, 1], aniso: PHONE ? 2 : 4, shadow: 0.5, evict: true },
    balanced: { label: 'Balanced', hq: true, cullPx: 0.6, lodPx: 1.0, res: [0.72, 1], aniso: PHONE ? 4 : 8, shadow: 1, evict: PHONE },
    quality: { label: 'Quality', hq: true, cullPx: 0.45, lodPx: 0.6, res: [0.85, PHONE ? 1 : 1.5], aniso: PHONE ? 8 : 16, shadow: PHONE ? 1 : 2, evict: PHONE },
  };
  const ORDER = ['performance', 'balanced', 'quality'];
  let preset = null;
  try { preset = localStorage.getItem('elyra.preset'); } catch (_) {}
  if (!PRESETS[preset]) { let q = null; try { q = localStorage.getItem('elyra.quality'); } catch (_) {} preset = q === 'low' ? 'performance' : PHONE ? 'balanced' : 'quality'; }
  let CFG = PRESETS[preset];
  // nothing in here may ever throw into the page (the levels show any uncaught error on screen)
  const safe = f => () => { try { f(); } catch (e) { if (!safe.n) { safe.n = 1; console.warn('perf', e); } } };

  /* ---------- per-frame state shared by the render hook and the culling test ---------- */
  const camPos = new THREE.Vector3(), _v = new THREE.Vector3(), _v2 = new THREE.Vector3(), _s = new THREE.Sphere(), _db = new THREE.Vector2();
  let INR = 0, pxK = 0, frame = 0, rseq = 0;
  const stat = { packedLast: 0, culledSmall: 0, lodSwaps: 0, lodTrisSaved: 0, lodMeshes: 0, lodReady: 0, cullFixed: 0, evicted: 0, evictedMB: 0 };
  let statFrame = { culled: 0 };
  const scenes = new Map();   // every scene rendered with a perspective camera, and when

  /* which meshes may be skipped when tiny: lit, opaque or normally blended, not glowing much, not a custom shader */
  const LIT = { MeshStandardMaterial: 1, MeshPhysicalMaterial: 1, MeshLambertMaterial: 1, MeshPhongMaterial: 1, MeshToonMaterial: 1 };
  function smallK(o) {
    if (o.__pk !== undefined && o.__pkm === o.material) return o.__pk;
    let k = 1;
    if (!o.isMesh || o.userData.noCull) k = 0;
    else for (const m of [].concat(o.material)) {
      if (!m) continue;
      if (!LIT[m.type] || m.blending === THREE.AdditiveBlending || Object.prototype.hasOwnProperty.call(m, 'onBeforeCompile') || m.depthTest === false) { k = 0; break; }
      if (m.emissiveMap || (m.emissive && (m.emissive.r + m.emissive.g + m.emissive.b) * (m.emissiveIntensity == null ? 1 : m.emissiveIntensity) > 0.05)) k = Math.min(k, 0.35);
    }
    o.__pk = k; o.__pkm = o.material; return k;
  }

  /* ---------- culling: correct bounds for instanced sets and skinned characters, then the tiny-object test ---------- */
  const FP = THREE.Frustum.prototype, rawIO = FP.intersectsObject;
  FP.intersectsObject = function (o) { try { return testObj(this, o); } catch (e) { return rawIO.call(this, o); } };
  function testObj(F, o) {
    const d = o.__pf;
    if (d) { if (!d(_s, o)) return true; }   // (bounds not known this frame: draw it)
    else {
      if (!INR) return rawIO.call(F, o);
      const g = o.geometry; if (!g) return rawIO.call(F, o);
      if (g.boundingSphere === null) g.computeBoundingSphere();
      _s.copy(g.boundingSphere).applyMatrix4(o.matrixWorld);
    }
    if (!F.intersectsSphere(_s)) return false;
    if (INR && pxK > 0) {
      const k = smallK(o);
      if (k > 0) {
        const D = _s.center.distanceTo(camPos);
        if (D > _s.radius) {
          const px = _s.radius / D * pxK, t = CFG.cullPx * k * (o.__cc ? 1.3 : 1);
          if (px < t) { o.__cc = 1; statFrame.culled++; return false; }
        }
        o.__cc = 0;
      }
    }
    return true;
  }

  // an instanced set's bounds: every instance's copy of the geometry's sphere (redone only when the instances change)
  function instSphere(o) {
    const g = o.geometry; if (!g || !o.instanceMatrix) return null;
    if (g.boundingSphere === null) g.computeBoundingSphere();
    const st = o.__pis || (o.__pis = { v: -1, n: -1, gs: null, c: new THREE.Vector3(), r: 0, sc: 1, churn: 0, lastF: -1, P: null, at: nowMs() });
    if (st.packing) return st;   // (drawing its packed copy this frame: keep the bounds of the whole set)
    const ver = o.instanceMatrix.version;
    if (st.v === ver && st.n === o.count && st.gs === g.boundingSphere) return st;
    st.at = nowMs();
    if (st.lastF === frame - 1 || st.lastF === frame) st.churn++; else st.churn = 0;
    st.lastF = frame;
    const n = o.count, a = o.instanceMatrix.array, bs = g.boundingSphere, cx = bs.center.x, cy = bs.center.y, cz = bs.center.z;
    if (st.churn > 90 && n > 1500) return 'give-up';   // re-placed every frame and big: not worth the work
    let x0 = Infinity, y0 = Infinity, z0 = Infinity, x1 = -Infinity, y1 = -Infinity, z1 = -Infinity, smax = 0;
    const P = st.P && st.P.length >= n * 4 ? st.P : new Float32Array(n * 4); st.P = P;
    for (let i = 0; i < n; i++) {
      const e = i * 16;
      const x = a[e] * cx + a[e + 4] * cy + a[e + 8] * cz + a[e + 12], y = a[e + 1] * cx + a[e + 5] * cy + a[e + 9] * cz + a[e + 13], z = a[e + 2] * cx + a[e + 6] * cy + a[e + 10] * cz + a[e + 14];
      const s = Math.sqrt(Math.max(a[e] * a[e] + a[e + 1] * a[e + 1] + a[e + 2] * a[e + 2], a[e + 4] * a[e + 4] + a[e + 5] * a[e + 5] + a[e + 6] * a[e + 6], a[e + 8] * a[e + 8] + a[e + 9] * a[e + 9] + a[e + 10] * a[e + 10]));
      const r = bs.radius * s;
      if (!(r < 1e9) || !isFinite(x + y + z)) continue;
      P[i * 4] = x; P[i * 4 + 1] = y; P[i * 4 + 2] = z; P[i * 4 + 3] = r;
      if (x - r < x0) x0 = x - r; if (y - r < y0) y0 = y - r; if (z - r < z0) z0 = z - r;
      if (x + r > x1) x1 = x + r; if (y + r > y1) y1 = y + r; if (z + r > z1) z1 = z + r;
      if (s > smax) smax = s;
    }
    if (x0 === Infinity) { st.c.set(0, 0, 0); st.r = 0; }
    else {
      st.c.set((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2); let R = 0;
      for (let i = 0; i < n; i++) { const dx = P[i * 4] - st.c.x, dy = P[i * 4 + 1] - st.c.y, dz = P[i * 4 + 2] - st.c.z, rr = Math.sqrt(dx * dx + dy * dy + dz * dz) + P[i * 4 + 3]; if (rr > R) R = rr; }
      st.r = R * 1.02 + 0.05;
    }
    st.sc = smax || 1; st.v = ver; st.n = n; st.gs = g.boundingSphere;
    return st;
  }
  function fixInstanced(o) {
    o.__pf = function (out) {
      const st = instSphere(o);
      if (st === 'give-up') { o.__pf = null; o.frustumCulled = false; stat.cullFixed--; return false; }
      if (!st) return false;
      if (st.r === 0 && o.count > 0) return false;
      out.center.copy(st.c).applyMatrix4(o.matrixWorld); out.radius = st.r * o.matrixWorld.getMaxScaleOnAxis();
      if (o.count === 0) out.radius = 0;
      return true;
    };
    o.frustumCulled = true; stat.cullFixed++; INSTS.add(o);
  }
  /* per-instance culling for big instanced sets spread over the map (rocks, props, crowds), which the set's own bounds can't cull:
     for the frame only, the set draws a packed copy of the instances inside the view (or, if it casts shadows, inside the sun's shadow
     area too, so no shadow goes missing), then its own list is put back. Only sets that have stayed put for 3 s; any change to the
     game's own list switches it straight back to drawing everything until it settles again. */
  const _fr = new THREE.Frustum(), _pm = new THREE.Matrix4(), _cs = new THREE.Sphere();
  const PACK = [], INSTS = new Set(), SUNS = new Set(), SUNF = new WeakMap();
  function packPrep(cam) {
    if (!INSTS.size) return;
    _pm.multiplyMatrices(cam.projectionMatrix, cam.matrixWorldInverse); _fr.setFromProjectionMatrix(_pm);
    const suns = [];
    for (const L of SUNS) if (L.castShadow && L.shadow && L.shadow.camera && L.parent && L.visible) {
      const c = L.shadow.camera, f = SUNF.get(c) || (SUNF.set(c, new THREE.Frustum()), SUNF.get(c));
      _pm.multiplyMatrices(c.projectionMatrix, c.matrixWorldInverse); f.setFromProjectionMatrix(_pm); suns.push(f);
    }
    const t = nowMs();
    for (const o of INSTS) {
      const st = o.__pis; if (!st || !st.P || !o.visible || o.count < 24 || st.v !== o.instanceMatrix.version || st.n !== o.count || t - st.at < 3000) continue;
      if (o.instanceColor) { if (st.cv === undefined) st.cv = o.instanceColor.version; if (o.instanceColor.version !== st.cv) { st.cv = o.instanceColor.version; st.at = t; continue; } }
      const pk = st.pk || (st.pk = { m: null, c: null, save: null });
      const n = o.count, P = st.P, src = o.instanceMatrix.array, mw = o.matrixWorld, ms = mw.getMaxScaleOnAxis(), small = smallK(o) * CFG.cullPx;
      const shadow = o.castShadow && suns.length > 0;
      if (!pk.m || pk.m.array.length < n * 16) { pk.m = new THREE.InstancedBufferAttribute(new Float32Array(n * 16), 16); pk.m.setUsage(THREE.DynamicDrawUsage); pk.c = null; }
      if (o.instanceColor && (!pk.c || pk.c.array.length < n * 3)) { pk.c = new THREE.InstancedBufferAttribute(new Float32Array(n * 3), 3); pk.c.setUsage(THREE.DynamicDrawUsage); }
      const dst = pk.m.array, csrc = o.instanceColor ? o.instanceColor.array : null, cdst = o.instanceColor ? pk.c.array : null;
      let k = 0;
      for (let i = 0; i < n; i++) {
        _cs.center.set(P[i * 4], P[i * 4 + 1], P[i * 4 + 2]).applyMatrix4(mw); _cs.radius = P[i * 4 + 3] * ms;
        let keep = _fr.intersectsSphere(_cs);
        if (keep && small > 0) { const D = _cs.center.distanceTo(camPos); if (D > _cs.radius && _cs.radius / D * pxK < small) keep = false; }
        if (!keep && shadow) for (const f of suns) if (f.intersectsSphere(_cs)) { keep = true; break; }
        if (!keep) continue;
        if (k !== i || src !== dst) dst.set(src.subarray(i * 16, i * 16 + 16), k * 16);
        if (cdst) cdst.set(csrc.subarray(i * 3, i * 3 + 3), k * 3);
        k++;
      }
      if (k === n) continue;   // all of it in view: the set draws as it is
      pk.m.needsUpdate = true; if (cdst) pk.c.needsUpdate = true;
      pk.save = [o.instanceMatrix, o.instanceColor, o.count];
      o.instanceMatrix = pk.m; if (cdst) o.instanceColor = pk.c; o.count = k; st.packing = true;
      PACK.push(o); stat.packedLast += n - k;
    }
  }
  function packRestore() { for (const o of PACK) { const st = o.__pis, v = st.pk.save; o.instanceMatrix = v[0]; o.instanceColor = v[1]; o.count = v[2]; st.packing = false; } PACK.length = 0; }
  // a skinned character's bounds: around its bones as they are posed this frame, padded by the size of the body
  function topOf(o) { while (o.parent) o = o.parent; return o; }
  function fixSkinned(o) {
    const sk = o.skeleton, g = o.geometry; if (!sk || !sk.bones || !sk.bones.length || !g) return;
    if (topOf(sk.bones[0]) !== topOf(o)) return;   // bones not in the same tree: their world matrices may not be kept up
    if (g.boundingSphere === null) g.computeBoundingSphere();
    const st = { f: -1, c: new THREE.Vector3(), r: 0 };
    o.__pf = function (out) {
      if (st.f !== rseq) {
        st.f = rseq; let x0 = Infinity, y0 = Infinity, z0 = Infinity, x1 = -Infinity, y1 = -Infinity, z1 = -Infinity;
        for (const b of sk.bones) { const e = b.matrixWorld.elements, x = e[12], y = e[13], z = e[14];
          if (x < x0) x0 = x; if (y < y0) y0 = y; if (z < z0) z0 = z; if (x > x1) x1 = x; if (y > y1) y1 = y; if (z > z1) z1 = z; }
        if (!isFinite(x0 + x1 + y0 + y1 + z0 + z1)) return false;
        st.c.set((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
        const half = Math.sqrt((x1 - x0) ** 2 + (y1 - y0) ** 2 + (z1 - z0) ** 2) / 2;
        const body = g.boundingSphere.radius * o.matrixWorld.getMaxScaleOnAxis();
        st.r = half + Math.max(0.4, body * 0.6);
      }
      out.center.copy(st.c); out.radius = st.r; return true;
    };
    o.frustumCulled = true; stat.cullFixed++;
  }

  /* ---------- automatic LOD (index-only copies made in a worker) ---------- */
  const LODMIN = 2000, LEVELS = [[0.5, 0.02], [0.25, 0.05], [0.1, 0.12]];
  const geoLod = new WeakMap(), LODM = [], SWAP = [];
  let lodQ = [], worker = null, busy = false, jobId = 0, workerDead = false;
  const OKMAT = { MeshStandardMaterial: 1, MeshPhysicalMaterial: 1, MeshLambertMaterial: 1, MeshPhongMaterial: 1, MeshBasicMaterial: 1, MeshToonMaterial: 1 };
  function lodEligible(o) {
    if (!o.isMesh || o.userData.noLod || o.isLOD) return false;
    const g = o.geometry; if (!g || !g.index || !g.attributes.position) return false;
    if (g.index.count / 3 < LODMIN) return false;
    if (g.morphAttributes && g.morphAttributes.position && g.morphAttributes.position.length) return false;
    if (g.groups && g.groups.length > 1) return false;
    if (g.drawRange && (g.drawRange.start !== 0 || (g.drawRange.count !== Infinity && g.drawRange.count < g.index.count))) return false;
    for (const m of [].concat(o.material)) if (!m || !OKMAT[m.type] || m.wireframe) return false;
    if (g.userData && g.userData.lodOf) return false;
    return true;
  }
  function lodRegister(o) {
    const g = o.geometry; let e = geoLod.get(g);
    if (!e) { e = { st: 0, levels: null, tris: g.index.count / 3, g }; geoLod.set(g, e); lodQ.push(e); }
    o.__lod = { g, e, cur: 0 }; o.__lodIn = 1; o.__pseen = scanId; LODM.push(o);
  }
  function makeWorker() {
    if (worker || workerDead || typeof Worker === 'undefined' || typeof Blob === 'undefined') return worker;
    const url = new URL('js/vendor/meshopt_simplifier.js?v=1', location.href).href;
    const src = `importScripts(${JSON.stringify(url)});
      onmessage=function(e){var d=e.data;MeshoptSimplifier.ready.then(function(){var out=[],tr=[];
        try{var sc=MeshoptSimplifier.getScale(d.pos,3),last=d.idx.length;
          for(var i=0;i<d.levels.length;i++){var L=d.levels[i],t=Math.floor(d.idx.length*L[0]/3)*3;if(t<36)break;
            var r=MeshoptSimplifier.simplify(d.idx,d.pos,3,t,L[1],['LockBorder']);var ind=r[0];
            if(ind.length>last*0.8||ind.length<12)continue;last=ind.length;
            var o=d.big?ind:new Uint16Array(ind);out.push({ind:o,err:r[1]*sc});tr.push(o.buffer);}
        }catch(x){}
        postMessage({id:d.id,out:out},tr);});};`;
    try { worker = new Worker(URL.createObjectURL(new Blob([src], { type: 'text/javascript' }))); }
    catch (e) { workerDead = true; return null; }
    worker.onerror = () => { workerDead = true; worker = null; busy = false; };
    worker.onmessage = ev => { try { got(ev); } catch (e) { busy = false; pending = null; } };
    function got(ev) {
      busy = false; const job = pending; pending = null; if (!job || ev.data.id !== job.id) return;
      const e = job.e, g = e.g, lv = [];
      for (const r of ev.data.out) {
        const lg = new THREE.BufferGeometry();
        for (const k in g.attributes) lg.setAttribute(k, g.attributes[k]);
        lg.setIndex(new THREE.BufferAttribute(r.ind, 1));
        lg.boundingSphere = g.boundingSphere; lg.boundingBox = g.boundingBox;
        lg.userData.lodOf = g; lg.name = (g.name || 'geo') + '·lod';
        lv.push({ geo: lg, err: r.err, tris: r.ind.length / 3 });
      }
      e.levels = lv; e.st = 2; if (lv.length) stat.lodReady++;
      g.addEventListener('dispose', () => { for (const l of lv) l.geo.dispose(); });   // (GPU copies only: both upload again if drawn)
      pump();
    }
    return worker;
  }
  let pending = null, pumpOn = false;
  function pump() {
    if (busy || !pumpOn || !lodQ.length) return;
    const w = makeWorker(); if (!w) return;
    lodQ.sort((a, b) => b.tris - a.tris);
    const e = lodQ.shift(); if (e.st) { setTimeout(pump, 0); return; }
    e.st = 1;
    try {
      const g = e.g, pa = g.attributes.position, n = pa.count;
      const arr = pa.isInterleavedBufferAttribute ? pa.data.array : pa.array;
      const div = !pa.normalized ? 1 : arr instanceof Int8Array ? 127 : arr instanceof Uint8Array ? 255 : arr instanceof Int16Array ? 32767 : arr instanceof Uint16Array ? 65535 : 1;
      const pos = new Float32Array(n * 3);
      for (let i = 0; i < n; i++) { pos[i * 3] = pa.getX(i) / div; pos[i * 3 + 1] = pa.getY(i) / div; pos[i * 3 + 2] = pa.getZ(i) / div; }
      const src = g.index.array, idx = new Uint32Array(src.length); idx.set(src);
      pending = { id: ++jobId, e }; busy = true;
      w.postMessage({ id: jobId, pos, idx, levels: LEVELS, big: n > 65535 }, [pos.buffer, idx.buffer]);
    } catch (err) { e.st = 2; busy = false; pending = null; setTimeout(pump, 0); }
  }
  // pick each mesh's copy for this view; put the originals back after the frame
  function lodPick() {
    const tau = CFG.lodPx;
    for (let i = LODM.length - 1; i >= 0; i--) {
      const o = LODM[i], L = o.__lod;
      if (!L) { LODM.splice(i, 1); continue; }
      if (o.geometry !== L.g) { o.__lod = null; o.__lodIn = 0; LODM.splice(i, 1); continue; }   // the game gave it new geometry
      const lv = L.e.levels; if (!lv || !lv.length || !o.visible) continue;
      let D, sc;
      if (o.__pf) { if (!o.__pf(_s, o)) continue; D = _s.center.distanceTo(camPos) - _s.radius; sc = o.isInstancedMesh && o.__pis ? o.__pis.sc * o.matrixWorld.getMaxScaleOnAxis() : o.matrixWorld.getMaxScaleOnAxis(); }
      else { const bs = L.g.boundingSphere || (L.g.computeBoundingSphere(), L.g.boundingSphere); _s.copy(bs).applyMatrix4(o.matrixWorld); D = _s.center.distanceTo(camPos) - _s.radius; sc = o.matrixWorld.getMaxScaleOnAxis(); }
      let pick = 0;
      if (D > 0.5) {
        const f = sc / D * pxK;
        for (let k = lv.length - 1; k >= 0; k--) { const t = k + 1 > L.cur ? tau * 0.8 : tau; if (lv[k].err * f < t) { pick = k + 1; break; } }
      }
      L.cur = pick;
      if (pick) { o.geometry = lv[pick - 1].geo; SWAP.push(o); stat.lodSwaps++; stat.lodTrisSaved += (L.e.tris - lv[pick - 1].tris) * (o.isInstancedMesh ? o.count : 1); }
    }
  }
  function lodRestore() { for (const o of SWAP) if (o.__lod) o.geometry = o.__lod.g; SWAP.length = 0; }

  /* ---------- the render hook ---------- */
  function wrapRender(raw) {
    return function (sc, cam) {
      if (INR || !cam || !cam.isPerspectiveCamera || !sc) return raw.call(this, sc, cam);
      INR = 1;
      try {
        if (cam.parent === null) cam.updateMatrixWorld();
        camPos.setFromMatrixPosition(cam.matrixWorld);
        const rt = this.getRenderTarget(), h = rt ? rt.height : this.getDrawingBufferSize(_db).y;
        pxK = (h / 2) / Math.tan(THREE.MathUtils.DEG2RAD * cam.fov / 2) * (cam.zoom || 1);
        scenes.set(sc, nowMs());
        rseq++; try { lodPick(); } catch (e) { lodRestore(); }
        try { packPrep(cam); } catch (e) { packRestore(); }
        rseq++;   // (the bones move when the render updates the scene: bounds for the culling below are worked out again)
        return raw.call(this, sc, cam);
      } finally { packRestore(); lodRestore(); INR = 0; }
    };
  }
  // the prototype, for renderers made later; and the level's own renderer, whose render other files have already wrapped
  // (their wrappers hold three.js's original, so the prototype alone would never be reached)
  const RP = THREE.WebGLRenderer.prototype; RP.render = wrapRender(RP.render);
  (function own() { const r = GR(); if (!r) { setTimeout(own, 300); return; } if (Object.prototype.hasOwnProperty.call(r, 'render') && !r.__perfWrapped) { r.render = wrapRender(r.render); r.__perfWrapped = 1; } })();

  /* ---------- scanning: new meshes get their bounds fixed and join the LOD list ---------- */
  // every scene drawn in the last ten minutes is walked, drawn this second or not (a paused game or a long load draws nothing, and
  // nothing still in a scene may age out); objects that have left every scene are the ones that stop being seen
  let begun = false, scanId = 0;
  function scan() {
    const t = nowMs(); scanId++; freeBudget = 24;
    for (const [sc, at] of scenes) {
      if (t - at > 600000) { scenes.delete(sc); continue; }
      sc.traverse(o => {
        o.__pseen = scanId;
        if (o.__pscan) {
          if (o.__pis && o.__pf && !INSTS.has(o)) INSTS.add(o);
          if ((o.isDirectionalLight || o.isSpotLight) && o.shadow) SUNS.add(o);
          if (o.__lod) { if (!o.__lodIn) { o.__lodIn = 1; LODM.push(o); } }
          else if (o.isMesh && o.__pg !== o.geometry) { o.__pg = o.geometry; if (lodEligible(o)) lodRegister(o); }   // (its geometry was replaced: the new one may qualify)
          if (CFG.evict) seen(o, t); return;
        }
        o.__pscan = 1;
        if ((o.isDirectionalLight || o.isSpotLight) && o.shadow) SUNS.add(o);
        if (o.isInstancedMesh && o.frustumCulled === false) {
          const m0 = [].concat(o.material)[0];
          if (m0 && !m0.isShaderMaterial && !Object.prototype.hasOwnProperty.call(m0, 'onBeforeCompile')) fixInstanced(o);
        } else if (o.isSkinnedMesh && o.frustumCulled === false) fixSkinned(o);
        o.__pg = o.geometry; if (lodEligible(o)) lodRegister(o);
        if (CFG.evict) seen(o, t);
      });
    }
    // meshes no longer in any scene leave the LOD list (it must not keep removed enemies and sets alive)
    for (let i = LODM.length - 1; i >= 0; i--) { const o = LODM[i]; if (o.__pseen !== scanId) { o.__lodIn = 0; LODM.splice(i, 1); } }
    stat.lodMeshes = LODM.length;
    for (const o of INSTS) if (o.__pseen !== scanId) INSTS.delete(o);
    for (const L of SUNS) if (L.__pseen !== scanId) SUNS.delete(L);
    if (lodQ.length) pump();
  }

  /* ---------- releasing GPU copies out of every scene for five minutes (over 256 KB) (phones; Performance everywhere) ---------- */
  const lastSeen = new Map(), TEXSLOT = ['map', 'normalMap', 'roughnessMap', 'metalnessMap', 'aoMap', 'emissiveMap', 'bumpMap', 'alphaMap', 'lightMap'];
  /* phones: a KTX2 texture's compressed data stays in JavaScript after the GPU has it (~45 MB on Site K). Once uploaded it is let go;
     such a texture is never released from the GPU (it couldn't be uploaded again). */
  const freed = new WeakSet();
  function freeAfterUpload(x) {
    if (!PHONE || !x.isCompressedTexture || freed.has(x) || !x.mipmaps || !x.mipmaps.length) return;
    if (freeBudget <= 0) return; freeBudget--;
    freed.add(x); const prev = x.onUpdate;
    x.onUpdate = function () { if (prev) try { prev.apply(this, arguments); } catch (_) {}
      let b = 0; for (const m of x.mipmaps) b += m.data ? m.data.byteLength : 0;
      x.mipmaps = x.mipmaps.map(m => ({ width: m.width, height: m.height, data: new Uint8Array(0) }));   // (new objects: a clone sharing the old ones keeps its data)
      x.__gpuBytes = b; x.__dataFreed = true; x.onUpdate = prev || null;
      // the GPU copy is the only one now: a later request to upload again (a filter change, say) is ignored rather than uploading nothing
      try { Object.defineProperty(x, 'needsUpdate', { configurable: true, set() {}, get() { return false; } }); } catch (_) {} };
    x.needsUpdate = true;   // (one more upload of the compressed data, which is cheap, and the copy here goes)
  }
  let freeBudget = 0;
  function seen(o, t) {
    if (o.geometry) lastSeen.set(o.geometry, t);
    if (o.material) for (const m of [].concat(o.material)) if (m) for (const k of TEXSLOT) { const x = m[k]; if (x && x.isTexture) { if (begun) freeAfterUpload(x); if (!x.__dataFreed) lastSeen.set(x, t); } }
  }
  let lastSweep = 0;
  function bytesOf(x) {
    if (x.isBufferGeometry) { let b = x.index ? x.index.array.byteLength : 0; for (const k in x.attributes) { const a = x.attributes[k]; b += (a.array || a.data.array).byteLength; } return b; }
    if (x.isTexture && x.image) return x.isCompressedTexture && x.mipmaps ? x.mipmaps.reduce((s, m) => s + (m.data ? m.data.byteLength : 0), 0) : (x.image.width || 0) * (x.image.height || 0) * 5.3;
    return 0;
  }
  function evictSweep() {
    if (!CFG.evict) { lastSeen.clear(); return; }
    const t = nowMs(), gap = t - lastSweep; lastSweep = t;
    if (!begun || document.hidden || gap > 40000) return;   // (the page was asleep: ages mean nothing yet)
    for (const [x, at] of lastSeen) {
      if (t - at < 300000) continue;
      lastSeen.delete(x);
      if (bytesOf(x) < 262144 || x.__dataFreed) continue;   // (small things: not worth an upload later)
      try {
        stat.evictedMB += bytesOf(x) / 1048576; x.dispose();
        stat.evicted++;
      } catch (_) {}
    }
  }

  /* ---------- presets: textures, shadows, the level's own quality switch ---------- */
  const shadowBase = new WeakMap(), texDone = new WeakMap();
  function sweepLook() {
    const r = GR(); if (!r) return;
    const maxA = Math.max(1, Math.min(CFG.aniso, (r.capabilities.getMaxAnisotropy && r.capabilities.getMaxAnisotropy()) || 1));
    const big = Math.min(4096, r.capabilities.maxTextureSize || 4096);
    for (const [sc, at] of scenes) {
      if (nowMs() - at > 30000) continue;
      sc.traverse(o => {
        if (o.isDirectionalLight && o.castShadow && o.shadow) {
          if (!shadowBase.has(o)) shadowBase.set(o, o.shadow.mapSize.x);
          const b = shadowBase.get(o); let want = b;
          if (CFG.shadow > 1 && b >= 2048) want = Math.min(big, b * CFG.shadow);
          else if (CFG.shadow < 1) want = Math.max(512, Math.round(b * CFG.shadow));
          if (o.shadow.mapSize.x !== want) { o.shadow.mapSize.set(want, want); if (o.shadow.map) { o.shadow.map.dispose(); o.shadow.map = null; } }
        }
        if (!o.material) return;
        for (const m of [].concat(o.material)) {
          if (!m) continue;
          for (const k of TEXSLOT) {
            const x = m[k]; if (!x || !x.isTexture || !x.image || x.__dataFreed) continue;
            const was = texDone.get(x);
            if (was === undefined) texDone.set(x, x.anisotropy);   // the level's own setting
            const own = texDone.get(x), want = Math.max(own, maxA);
            if (x.anisotropy !== want && own <= maxA) { x.anisotropy = want; x.needsUpdate = true; }
          }
        }
      });
    }
  }
  function setPreset(name, fromUser) {
    if (!PRESETS[name]) return;
    preset = name; CFG = PRESETS[name];
    try { localStorage.setItem('elyra.preset', name); } catch (_) {}
    let lvHQ = null; try { lvHQ = typeof HQ !== 'undefined' ? HQ : null; } catch (_) {}
    if (lvHQ !== null && lvHQ !== CFG.hq && typeof setQuality === 'function') { try { setQuality(CFG.hq); } catch (e) {} }
    RES.reset();
    if (fromUser) sweepLook();
    label();
  }
  function label() { const b = document.getElementById('quality'); if (b) b.textContent = 'Graphics: ' + CFG.label; }

  /* ---------- adaptive resolution ---------- */
  const RES = (() => {
    let base = null, mine = null, wait = 6, frames = 0, t0 = nowMs(), hist = [], down = null, holdUp = 0;
    const SNAP = 0.05, snap = v => Math.round(v / SNAP) * SNAP;
    function range() { const b = base || 1; const lo = Math.max(0.5, b * CFG.res[0]); const hi = !PHONE && CFG.res[1] > 1 ? Math.max(b, Math.min(1.5, b * CFG.res[1])) : b; return [lo, hi]; }
    function apply(pr) { const r = GR(); if (!r) return; pr = snap(pr); if (Math.abs(r.getPixelRatio() - pr) < 0.01) return; r.setPixelRatio(pr); mine = pr; dispatchEvent(new Event('resize')); }
    function covered() { return document.hidden || window.ELYRA_WARMING || !!document.getElementById('pgStart') || (typeof PG !== 'undefined' && PG.paused); }
    function tick(now) {
      requestAnimationFrame(tick); frame++;
      try { step(now); } catch (e) {}
    }
    function step(now) {
      if (covered() || window.ELYRA_FIXED_RES) { frames = 0; t0 = now; return; }   // (ELYRA_FIXED_RES: tests and screenshots)
      frames++; const el = (now - t0) / 1000; if (el < 1.5) return;
      const fps = frames / el; frames = 0; t0 = now;
      const r = GR(); if (!r) return;
      const cur = r.getPixelRatio();
      if (base === null || (mine !== null && Math.abs(cur - mine) > 0.01) || (mine === null && Math.abs(cur - base) > 0.01)) { base = cur; mine = null; wait = 2; down = null; }   // the level (or its quality switch) set it
      if (wait > 0) { wait--; return; }
      const [lo, hi] = range();
      if (down) {   // did the last step down help?
        if (fps < down.fps * 1.05 && fps < 50) { apply(down.from); holdUp = 0; down = null; wait = 20; return; }   // no: put it back, the GPU isn't what's slow
        down = null;
      }
      if (fps < 47 && cur > lo + 0.01) { down = { from: cur, fps }; apply(Math.max(lo, cur * 0.88)); holdUp = 6; wait = 1; return; }
      if (holdUp > 0) { holdUp--; return; }
      if (fps >= 57.5 && cur < hi - 0.01) { apply(Math.min(hi, cur + (cur < base ? 0.1 : 0.25))); wait = 2; }
    }
    requestAnimationFrame(tick);
    return { reset() { mine = null; base = null; wait = 2; down = null; }, get scale() { const r = GR(); return r && base ? r.getPixelRatio() / base : 1; }, get base() { return base; } };
  })();

  /* ---------- the monitor ---------- */
  const FT = []; let lastT = nowMs(), loadMs = null;
  (function ft(now) { requestAnimationFrame(ft); FT.push(now - lastT); lastT = now; if (FT.length > 240) FT.shift(); })(nowMs());
  const fr = { calls: 0, tris: 0 }, frLast = { calls: 0, tris: 0 };
  (function hookInfo() {
    const r = GR(); if (!r) { setTimeout(hookInfo, 500); return; }
    const raw = r.render.bind(r);   // per-instance wrapper on top of the prototype one: sums every render call in a frame
    r.render = function (s, c) { const out = raw(s, c); fr.calls += r.info.render.calls; fr.tris += r.info.render.triangles; return out; };
    (function roll() { requestAnimationFrame(roll); frLast.calls = fr.calls; frLast.tris = fr.tris; fr.calls = fr.tris = 0;
      stat.culledSmallLast = statFrame.culled; statFrame.culled = 0; stat.packed = stat.packedLast; stat.packedLast = 0; })();
  })();
  (function watchLoad() { const b = document.getElementById('pgStart'); if (b && !b.disabled) { loadMs = nowMs(); return; } if (!b && document.readyState === 'complete' && nowMs() > 15000) { loadMs = loadMs || nowMs(); return; } setTimeout(watchLoad, 250); })();
  function memEstimate() {
    const geos = new Set(), texs = new Set(); let g = 0, t = 0;
    for (const [sc, at] of scenes) { if (nowMs() - at > 30000) continue; sc.traverse(o => { if (o.geometry) geos.add(o.geometry); if (o.material) for (const m of [].concat(o.material)) if (m) for (const k of TEXSLOT) { const x = m[k]; if (x && x.isTexture) texs.add(x); } }); }
    for (const x of geos) { for (const k in x.attributes) { const a = x.attributes[k]; g += (a.array || a.data.array).byteLength; } if (x.index) g += x.index.array.byteLength; }
    for (const x of texs) { const im = x.image; if (!im) continue; if (x.isCompressedTexture && x.mipmaps) { if (x.__gpuBytes) t += x.__gpuBytes; else for (const m of x.mipmaps) t += m.data ? m.data.byteLength : 0; } else t += (im.width || 0) * (im.height || 0) * 4 * 1.333; }
    let rt = 0; const r = GR(); if (r) { const s = r.getDrawingBufferSize(_db); rt = s.x * s.y * 4 * (PHONE ? 6 : 9); }
    return { geoMB: g / 1048576, texMB: t / 1048576, targetsMB: rt / 1048576 };
  }
  function bytes() {
    let all = 0, models = 0; try { for (const e of performance.getEntriesByType('resource')) { const b = e.transferSize || e.encodedBodySize || 0; all += b; if (/\.(glb|ktx2)(\?|$)/.test(e.name)) models += b; } } catch (_) {}
    return { allMB: all / 1048576, modelsMB: models / 1048576 };
  }
  function report() {
    const r = GR(), s = FT.slice(-120).sort((a, b) => a - b), avg = s.reduce((a, b) => a + b, 0) / Math.max(1, s.length);
    const low = s.length ? s.slice(Math.floor(s.length * 0.99)).reduce((a, b) => a + b, 0) / Math.max(1, s.length - Math.floor(s.length * 0.99)) : 0;
    const m = memEstimate(), b = bytes();
    return {
      preset, fps: +(1000 / Math.max(1, avg)).toFixed(1), low1: +(1000 / Math.max(1, low)).toFixed(1), frameMs: +avg.toFixed(1),
      calls: frLast.calls, trisK: Math.round(frLast.tris / 1000), glGeometries: r ? r.info.memory.geometries : 0, glTextures: r ? r.info.memory.textures : 0, programs: r && r.info.programs ? r.info.programs.length : 0,
      gpuMB: Math.round(m.geoMB + m.texMB + m.targetsMB), geoMB: Math.round(m.geoMB), texMB: Math.round(m.texMB),
      pixelRatio: r ? +r.getPixelRatio().toFixed(2) : 0, renderScale: +RES.scale.toFixed(2),
      lodMeshes: stat.lodMeshes, lodReady: stat.lodReady, lodQueued: lodQ.length, culledSmall: stat.culledSmallLast || 0, cullFixed: stat.cullFixed, instancesCulled: stat.packed || 0,
      evicted: stat.evicted, evictedMB: Math.round(stat.evictedMB), loadS: loadMs ? +(loadMs / 1000).toFixed(1) : null, downloadMB: +b.allMB.toFixed(1), modelsMB: +b.modelsMB.toFixed(1),
      jsHeapMB: performance.memory ? Math.round(performance.memory.usedJSHeapSize / 1048576) : null,
    };
  }
  let hud = null, hudT = 0;
  function showStats(on) {
    try { localStorage.setItem('elyra.perfStats', on ? '1' : '0'); } catch (_) {}
    if (!on) { if (hud) { hud.remove(); hud = null; } clearInterval(hudT); statsBtn(); return; }
    if (!hud) {
      hud = document.createElement('div'); hud.id = 'perfHud';
      hud.style.cssText = 'position:fixed;left:calc(env(safe-area-inset-left,0px) + 8px);bottom:calc(env(safe-area-inset-bottom,0px) + 8px);z-index:50;pointer-events:none;padding:6px 8px;border-radius:3px;background:rgba(6,8,14,.72);color:#cfe9ff;font:11px/1.35 ui-monospace,Menlo,Consolas,monospace;white-space:pre;border:1px solid rgba(127,227,255,.3)';
      document.body.appendChild(hud);
    }
    const draw = () => { if (!hud) return; const R = report();
      hud.textContent = `${R.fps} fps  1% ${R.low1}  ${R.frameMs} ms\n${R.calls} draws  ${R.trisK}k tris\nGPU ~${R.gpuMB} MB (tex ${R.texMB}, geo ${R.geoMB})\n${R.glTextures} tex  ${R.glGeometries} geo  ${R.programs} shaders\nscale ${R.renderScale} (${R.pixelRatio}x)  ${CFG.label}\nLOD ${R.lodReady}/${R.lodMeshes}  culled ${R.culledSmall}+${R.instancesCulled}i\nload ${R.loadS == null ? '…' : R.loadS + ' s'}  ${R.downloadMB} MB` +
        (R.jsHeapMB ? `  heap ${R.jsHeapMB} MB` : '') + (R.evicted ? `\nfreed ${R.evicted} (${R.evictedMB} MB)` : ''); };
    clearInterval(hudT); hudT = setInterval(safe(draw), 1000); safe(draw)(); statsBtn();
  }
  function statsBtn() { const b = document.getElementById('perfStats'); if (b) b.textContent = 'Performance stats: ' + (hud ? 'on' : 'off'); }

  /* ---------- wiring: the Graphics button replaces "Quality: high/low", a stats switch beside it ---------- */
  function wire() {
    const q = document.getElementById('quality');
    if (q && !q.__perf) {
      const nb = q.cloneNode(true); nb.__perf = true; q.replaceWith(nb);   // (drops the level's own high/low listener)
      nb.addEventListener('click', e => { e.stopPropagation(); setPreset(ORDER[(ORDER.indexOf(preset) + 1) % ORDER.length], true); nb.blur(); });
      const sb = document.createElement('button'); sb.type = 'button'; sb.id = 'perfStats'; sb.setAttribute('data-set', ''); sb.className = nb.className;
      sb.addEventListener('click', e => { e.stopPropagation(); showStats(!hud); sb.blur(); });
      nb.after(sb);
    }
    label(); statsBtn();
  }
  if (document.readyState === 'loading') addEventListener('DOMContentLoaded', wire, { once: true }); else wire();
  addEventListener('keydown', e => { if (e.code === 'F8') { e.preventDefault(); showStats(!hud); } });
  let wantStats = /[?&]perf\b/.test(location.search); try { wantStats = wantStats || localStorage.getItem('elyra.perfStats') === '1'; } catch (_) {}
  if (wantStats) (document.body ? showStats(true) : addEventListener('DOMContentLoaded', () => showStats(true), { once: true }));

  /* ---------- start ---------- */
  setPreset(preset, false);
  setInterval(safe(scan), 1500);
  setInterval(safe(evictSweep), 15000);
  [1500, 4000, 9000, 16000].forEach(t => setTimeout(safe(sweepLook), t)); setInterval(safe(sweepLook), 6000);
  // simplification waits for play to start (the loading screen has enough to do), or 12 s on pages without one
  const go = () => { begun = true; if (pumpOn) return; pumpOn = true; setTimeout(pump, 1500); };
  addEventListener('elyra-begin', go, { once: true }); setTimeout(() => { if (!document.getElementById('pgStart')) go(); }, 12000);

  window.ELYRA_PERF = { report, setPreset, get preset() { return preset; }, PRESETS, showStats, stat };
})();
