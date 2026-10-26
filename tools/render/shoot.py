"""Deterministic capture harness for ELYRA pages.
Fake clock (setTimeout/setInterval/rAF/performance.now/Date.now) stepped 50 ms at a time from here;
renders are skipped except on capture frames. CDN three.js routed to local npm three@0.128.0.
usage: python3 shoot.py URL OUTDIR --every 1.0 --len 60 [--start JS] [--w 960 --h 540] [--pre JS] [--at t1,t2]
"""
import asyncio, argparse, os, sys, json, time
from playwright.async_api import async_playwright

HERE = os.path.dirname(os.path.abspath(__file__))
TN = os.path.join(HERE, 'node_modules/three')

FAKE = r"""
(()=>{const R={st:setTimeout.bind(window)};let now=performance.now(),base=Date.now()-now,id=1,timers=new Map(),rafs=[];
performance.now=()=>now;const DN=Date;Date.now=()=>Math.floor(base+now);
window.setTimeout=(f,ms,...a)=>{const i=id++;timers.set(i,{t:now+Math.max(0,+ms||0),f,a,rep:0,seq:i});return i;};
window.setInterval=(f,ms,...a)=>{const i=id++;ms=Math.max(4,+ms||0);timers.set(i,{t:now+ms,f,a,rep:ms,seq:i});return i;};
window.clearTimeout=window.clearInterval=i=>{timers.delete(i);};
window.requestAnimationFrame=f=>{const i=id++;rafs.push({i,f});return i;};
window.cancelAnimationFrame=i=>{rafs=rafs.filter(r=>r.i!==i);};
window.__realTimeout=R.st;window.__gameT=0;
window.__adv=async(ms,render)=>{const end=now+ms;let n=0;for(;;){let best=null;for(const[k,v]of timers)if(v.t<=end&&(!best||v.t<best[1].t||(v.t===best[1].t&&v.seq<best[1].seq)))best=[k,v];
  if(!best)break;now=Math.max(now,best[1].t);const[k,v]=best;if(v.rep)v.t+=v.rep;else timers.delete(k);
  try{typeof v.f==='function'?v.f(...v.a):(0,eval)(v.f);}catch(e){console.error('timer',e&&e.stack||e);}
  if(++n%8===0)await new Promise(r=>R.st(r,0));else await Promise.resolve();}
  now=end;window.__gameT+=ms;window.__render=!!render;const q=rafs;rafs=[];for(const r of q)try{r.f(now);}catch(e){console.error('raf',e&&e.stack||e);}
  window.__render=true;await new Promise(r=>R.st(r,0));return 1;};
})();
"""
WRAP = r"""
;(function(){const W=THREE.WebGLRenderer;function R(p){p=Object.assign({},p||{},{preserveDrawingBuffer:true});const r=new W(p);const o=r.render;r.render=function(s,c){if(window.__render===false)return;return o.call(r,s,c);};(window.__renderers=window.__renderers||[]).push(r);return r;}R.prototype=W.prototype;THREE.WebGLRenderer=R;})();
"""

async def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('url'); ap.add_argument('out')
    ap.add_argument('--every', type=float, default=1.0)
    ap.add_argument('--len', type=float, default=60)
    ap.add_argument('--at', default='')
    ap.add_argument('--start', default='')
    ap.add_argument('--pre', default='')
    ap.add_argument('--load', type=float, default=4.0, help='game seconds stepped while loading before --start')
    ap.add_argument('--w', type=int, default=960); ap.add_argument('--h', type=int, default=540)
    ap.add_argument('--until', default='', help='JS expr: stop when truthy')
    ap.add_argument('--waitjs', default='', help='JS expr: during load, keep stepping until truthy (max 300 real s)')
    ap.add_argument('--mobile', action='store_true')
    ap.add_argument('--acts', default='', help='file of lines  T|js  run when game time reaches T')
    a = ap.parse_args()
    os.makedirs(a.out, exist_ok=True)
    log = open(os.path.join(a.out, 'console.log'), 'w')
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required', '--mute-audio'])
        ctx = await b.new_context(viewport={'width': a.w, 'height': a.h}, device_scale_factor=1, is_mobile=a.mobile, has_touch=a.mobile)
        page = await ctx.new_page()
        page.set_default_timeout(600000)   # Tide City's first frame compiles every shader in software GL: well past the 30 s default
        page.on('console', lambda m: log.write(f'[{m.type}] {m.text}\n') if m.type in ('error', 'warning') else None)
        page.on('pageerror', lambda e: log.write(f'[pageerror] {e}\n'))
        page.on('requestfailed', lambda r: log.write(f'[reqfail] {r.url} {r.failure}\n'))
        await page.add_init_script(FAKE)
        if a.pre: await page.add_init_script(a.pre)
        async def route(route):
            u = route.request.url
            if 'three.min.js' in u or 'three@0.128.0/build/three' in u:
                body = open(os.path.join(TN, 'build/three.min.js')).read() + WRAP
                return await route.fulfill(body=body, content_type='application/javascript')
            if 'three@0.128.0/examples/' in u:
                rel = u.split('three@0.128.0/')[1].split('?')[0]
                fp = os.path.join(TN, rel)
                if os.path.exists(fp): return await route.fulfill(path=fp, content_type='application/javascript')
            if 'fonts.googleapis' in u or 'fonts.gstatic' in u:
                return await route.fulfill(body='', content_type='text/css')
            return await route.continue_()
        await page.route('**/*', route)
        await page.goto(a.url, wait_until='load', timeout=120000)
        # loading: step slowly in real time
        t0 = time.time()
        steps = int(a.load / 0.05)
        for i in range(steps):
            await page.evaluate('__adv(50,false)')
            await asyncio.sleep(0.01)
        if a.waitjs:
            while time.time() - t0 < 300:
                if await page.evaluate(a.waitjs): break
                await page.evaluate('__adv(50,false)'); await asyncio.sleep(0.05)
            log.write(f'[harness] waitjs done after {time.time()-t0:.1f}s real\n')
        if a.start:
            await page.evaluate(a.start)
        ats = sorted(float(x) for x in a.at.split(',') if x.strip()) if a.at else None
        acts = []
        if a.acts:
            for ln in open(a.acts):
                if '|' in ln and not ln.startswith('#'):
                    tt, js = ln.split('|', 1); acts.append((float(tt), js.strip()))
        acts.sort(key=lambda x: x[0])
        t = 0.0; nxt = 0.0; k = 0; real0 = time.time()
        while t < a.len:
            while acts and t + 1e-6 >= acts[0][0]:
                tt, js = acts.pop(0)
                try:
                    r = await page.evaluate(js)
                    log.write(f'[act {tt}] {str(r)[:300]}\n')
                except Exception as e:
                    log.write(f'[act {tt} ERR] {e}\n')
            cap = False
            if ats is not None:
                if ats and t + 1e-6 >= ats[0]: cap = True; ats.pop(0)
            elif t + 1e-6 >= nxt: cap = True; nxt += a.every
            await page.evaluate(f'__adv(50,{str(cap).lower()})')
            if cap:
                fn = os.path.join(a.out, f'{k:03d}_{t:06.2f}.jpg'); k += 1
                await page.screenshot(path=fn, type='jpeg', quality=72)
            t += 0.05
            if a.until and int(t * 20) % 20 == 0 and await page.evaluate(a.until): break
            if ats is not None and not ats: break
        log.write(f'[harness] {k} frames, game {t:.1f}s, real {time.time()-real0:.0f}s\n')
        await b.close()
    log.close()

asyncio.run(main())
