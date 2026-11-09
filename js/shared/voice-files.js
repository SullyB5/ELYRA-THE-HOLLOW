/* =====================================================================================================================
   VOICE FILES · every line in the game, recorded (Nov 8 2026). audio/voice/index.json maps a line to its clip:
   "speaker|delivery|text" → [clip id, seconds]. Delivery is '' (normal), a (combat: alert/sharp), t (tired), w (whisper),
   s (soft), h (ELYRA, signal degraded), e / e2 (Rhen's voice coming back out of the cave).
   Settings → Voices: On (the default) or Subtitles only (key elyra.vo). A line with no clip just shows its subtitle;
   the device's built-in speech is never used. Each page quietly fetches the clips its own scripts speak, so a line
   rarely waits on the network. Both voice engines use this: js/shared/audio.js (levels) and js/menu/call-sound.js (footage).
   tools/voice/ has the cast and the scripts that rendered the clips.
   ===================================================================================================================== */
window.VOICEFILES = window.VOICEFILES || (() => {
  const BASE = 'audio/voice/';
  const TC = { alert: 'a', sharp: 'a', tired: 't', whisper: 'w', human: 'h', echo: 'e', echo2: 'e2', soft: 's' };
  let MAP = null, BY = null;
  const bytes = new Map(), bufs = new Map(), missed = new Set();
  const norm = t => String(t).replace(/[’‘]/g, "'").replace(/[“”]/g, '"').replace(/…/g, '...').replace(/\s+/g, ' ').trim();
  const enabled = () => { try { return localStorage.getItem('elyra.vo') !== 'off'; } catch (_) { return true; } };
  function find(who, text, tone) {
    if (!MAP || !who || !text) return null;
    const n = norm(text), tc = TC[tone] || '';
    for (const c of [tc, '', 'a']) { const r = MAP[who + '|' + c + '|' + n]; if (r) return { id: r[0], dur: r[1] }; }
    // a line the build didn't record: logged, so it can be added (VOICEFILES.missed in the console)
    const k = who + '|' + tc + '|' + n; if (!missed.has(k)) { missed.add(k); try { console.info('[voice] no clip:', k); } catch (_) {} }
    return null;
  }
  function get(id) {
    if (!bytes.has(id)) bytes.set(id, fetch(BASE + id + '.mp3').then(r => { if (!r.ok) throw 0; return r.arrayBuffer(); }));
    return bytes.get(id);
  }
  function decode(ctx, id) {
    if (bufs.has(id)) return bufs.get(id);
    // decodeAudioData consumes its buffer: decode a copy so the bytes stay cached for another context (menu → footage)
    const p = get(id).then(ab => new Promise((res, rej) => { const c = ab.slice(0); const q = ctx.decodeAudioData(c, res, rej); if (q && q.then) q.then(res, rej); }));
    p.catch(() => bufs.delete(id)); bufs.set(id, p); return p;
  }
  /* play one clip into dest. cb.start() when it begins, cb.end() when it finishes, is stopped, or fails.
     Returns {stop}. A clip that hasn't arrived within `wait` seconds is given up on (cb.fail), so the line falls back
     to its subtitle instead of starting late over the next one. */
  function play(ctx, dest, id, cb, wait) {
    let src = null, dead = false, began = false;
    const end = () => { if (dead) return; dead = true; clearTimeout(to); cb.end && cb.end(); };
    const to = setTimeout(() => { if (!began && !dead) { dead = true; cb.fail && cb.fail(); } }, (wait || 2.5) * 1000);
    decode(ctx, id).then(buf => {
      if (dead) return;
      src = ctx.createBufferSource(); src.buffer = buf; const g = ctx.createGain(); g.gain.value = cb.vol || 1;
      src.connect(g); g.connect(dest); src.onended = end; began = true; clearTimeout(to); src.start(); cb.start && cb.start(buf.duration);
    }, () => { if (!dead) { dead = true; clearTimeout(to); cb.fail && cb.fail(); } });
    return { stop() { if (dead) return; if (src) { try { src.onended = null; src.stop(); } catch (_) {} } end(); } };
  }
  // fetch (not decode) the clips this page's own scripts speak, a few at a time
  function prefetch() {
    if (!BY || !enabled()) return;
    const mine = new Set();
    for (const s of document.querySelectorAll('script[src]')) { const m = (s.getAttribute('src') || '').match(/(js\/[^?#]+\.js)/); if (m && BY[m[1]]) for (const id of BY[m[1]]) mine.add(id); }
    const q = [...mine]; let live = 0;
    const pump = () => { while (live < 4 && q.length) { const id = q.shift(); live++; get(id).catch(() => bytes.delete(id)).finally(() => { live--; pump(); }); } };
    setTimeout(pump, 1500);
  }
  /* Settings → Subtitles: On (default) / Off (key elyra.subs). Off hides every line's text (radio, cutscenes, the prologue,
     the space battle's comms, the footage reels); the lines keep their timing either way. */
  const subsOn = () => { try { return localStorage.getItem('elyra.subs') !== 'off'; } catch (_) { return true; } };
  const applySubs = () => { try { document.documentElement.classList.toggle('nosubs', !subsOn()); } catch (_) {} };
  try { const st = document.createElement('style'); st.textContent = 'html.nosubs .pgcomms,html.nosubs .cs-sub,html.nosubs #prol .psub,html.nosubs #comms,html.nosubs #ftg .sub{display:none!important}'; document.head.appendChild(st); } catch (_) {}
  applySubs();
  const ready = fetch(BASE + 'index.json?v=1806000000').then(r => r.json()).then(j => { MAP = j.lines; BY = j.byFile; prefetch(); }).catch(() => {});
  return {
    find, play, prefetch, ready, enabled, norm,
    // a script loaded after the page (the menu's footage): fetch its clips now
    prefetchFile(f) { ready.then(() => { if (!BY || !BY[f] || !enabled()) return; let i = 0; const ids = BY[f]; const pump = () => { for (let k = 0; k < 4 && i < ids.length; k++) get(ids[i++]).catch(() => {}); if (i < ids.length) setTimeout(pump, 250); }; pump(); }); },
    set(v) { try { localStorage.setItem('elyra.vo', v ? 'on' : 'off'); } catch (_) {} },
    subsOn, setSubs(v) { try { localStorage.setItem('elyra.subs', v ? 'on' : 'off'); } catch (_) {} applySubs(); },
    get missed() { return [...missed]; },
    get loaded() { return !!MAP; },
  };
})();
