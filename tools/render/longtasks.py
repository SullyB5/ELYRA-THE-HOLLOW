"""Real-time long-task profiler (testing only). Loads a level, clicks Begin, plays N seconds, records every main-thread
task over 50 ms and a CPU profile, then prints the long tasks and the heaviest functions inside them.
usage: python3 longtasks.py pathfinder.html [--play 20] [--acts file] [--w 1280 --h 720]
"""
import asyncio, argparse, os, json, collections
from playwright.async_api import async_playwright

HERE = os.path.dirname(os.path.abspath(__file__))
TN = os.path.join(HERE, 'node_modules/three')
LT = r"""
window.__lt=[];window.__mark=[];try{new PerformanceObserver(l=>{for(const e of l.getEntries())__lt.push([Math.round(e.startTime),Math.round(e.duration)]);}).observe({type:'longtask',buffered:true});}catch(e){}
window.__m=s=>__mark.push([Math.round(performance.now()),s]);
"""

async def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('page'); ap.add_argument('--play', type=float, default=20); ap.add_argument('--acts', default='')
    ap.add_argument('--w', type=int, default=1280); ap.add_argument('--h', type=int, default=720)
    ap.add_argument('--pre', default=''); ap.add_argument('--out', default='/tmp/lt.json')
    a = ap.parse_args()
    acts = []
    if a.acts:
        for ln in open(os.path.join(HERE, a.acts)):
            if '|' in ln and not ln.startswith('#'):
                t, js = ln.split('|', 1); acts.append((float(t), js.strip()))
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--mute-audio', '--autoplay-policy=no-user-gesture-required'])
        ctx = await b.new_context(viewport={'width': a.w, 'height': a.h})
        page = await ctx.new_page(); page.set_default_timeout(900000)
        page.on('pageerror', lambda e: print('[pageerror]', e))
        page.on('console', lambda m: print('[c]', m.text[:200]) if m.type in ('error',) else None)
        await page.add_init_script(LT)
        await page.add_init_script("try{localStorage.removeItem('elyra.checkpoint')}catch(e){}" + a.pre)
        async def route(route):
            u = route.request.url
            if 'three.min.js' in u: return await route.fulfill(path=os.path.join(TN, 'build/three.min.js'), content_type='application/javascript')
            if 'three@0.128.0/examples/' in u:
                fp = os.path.join(TN, u.split('three@0.128.0/')[1].split('?')[0])
                if os.path.exists(fp): return await route.fulfill(path=fp, content_type='application/javascript')
            if 'fonts.g' in u: return await route.fulfill(body='', content_type='text/css')
            return await route.continue_()
        await page.route('**/*', route)
        cdp = await ctx.new_cdp_session(page)
        await cdp.send('Profiler.enable'); await cdp.send('Profiler.setSamplingInterval', {'interval': 1000}); await cdp.send('Profiler.start')
        await page.goto('http://localhost:8123/' + a.page, wait_until='load', timeout=300000)
        await page.evaluate("__m('load')")
        await page.wait_for_function("(()=>{const b=document.getElementById('pgStart');return b&&!b.disabled})()", timeout=900000, polling=500)
        await page.evaluate("__m('ready')")
        await asyncio.sleep(1)
        await page.evaluate("__m('begin');document.getElementById('pgStart').click()")
        t = 0; ai = 0
        while t < a.play:
            while ai < len(acts) and acts[ai][0] <= t:
                try: r = await page.evaluate(acts[ai][1]); print(f'act {acts[ai][0]}: {str(r)[:120]}')
                except Exception as e: print('act err', e)
                await page.evaluate(f"__m('act{acts[ai][0]}')"); ai += 1
            await asyncio.sleep(.5); t += .5
        prof = (await cdp.send('Profiler.stop'))['profile']
        lt = await page.evaluate('__lt'); mk = await page.evaluate('__mark')
        fps = await page.evaluate('typeof renderer!=="undefined"?renderer.info.render.calls+" calls "+renderer.info.programs.length+" programs":""')
        print('marks', mk); print('renderer', fps)
        print('long tasks (start ms, dur ms), >150ms:')
        for s, d in lt:
            if d > 150: print(f'  {s:>7} {d:>6}')
        # attribute samples inside long tasks >150ms to functions (self + inclusive by top frames)
        nodes = {n['id']: n for n in prof['nodes']}
        parent = {}
        for n in prof['nodes']:
            for c in n.get('children', []): parent[c] = n['id']
        t0 = prof['startTime']; ts = t0; times = []
        for dt in prof['timeDeltas']: ts += dt; times.append(ts)
        # page performance.now origin vs profile clock: align using first long task is hard; use wall overlap via profile-relative ms
        nav0 = await page.evaluate('performance.timeOrigin')
        windows = [(s, s + d) for s, d in lt if d > 150]
        incl = collections.Counter(); selfc = collections.Counter()
        for sid, tt in zip(prof['samples'], times):
            ms = tt / 1000 - nav0 if False else None
            # profiler timestamps are monotonic micros; map with performance.timeOrigin unavailable -> use relative to start
            selfc_key = None
        # simpler: relative alignment: profile start ~ page goto; use mark 'load' offset unknown -> report global inclusive time
        tot = collections.Counter(); own = collections.Counter()
        for sid in prof['samples']:
            n = nodes[sid]; cf = n['callFrame']
            own[(cf['functionName'] or '(anon)', cf['url'].split('/')[-1].split('?')[0], cf['lineNumber'])] += 1
            seen = set(); cur = sid
            while cur is not None:
                cf = nodes[cur]['callFrame']; k = (cf['functionName'] or '(anon)', cf['url'].split('/')[-1].split('?')[0], cf['lineNumber'])
                if k not in seen: tot[k] += 1; seen.add(k)
                cur = parent.get(cur)
        print('top self (ms):')
        for k, v in own.most_common(30): print(f'  {v:>6} {k}')
        print('top inclusive (ms), game files:')
        n = 0
        for k, v in tot.most_common(400):
            if k[1].endswith('.js') and 'three' not in k[1] and 'Shader' not in k[1] and 'Pass' not in k[1] and 'Composer' not in k[1]:
                print(f'  {v:>6} {k}'); n += 1
                if n > 45: break
        json.dump({'lt': lt, 'marks': mk, 'prof': prof}, open(a.out, 'w'))
        await b.close()

asyncio.run(main())
