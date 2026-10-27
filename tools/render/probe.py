"""Real-time probe (testing only): load a level, wait for Begin, optionally click it, then run `T|js` lines from an .acts file
(T in real seconds after Begin) and print what each returns. Screenshots: a line `T|@shot name`.
usage: python3 probe.py pathfinder.html acts_file [--nobegin] [--w 1280 --h 720] [--out dir]
"""
import asyncio, argparse, os
from playwright.async_api import async_playwright
HERE = os.path.dirname(os.path.abspath(__file__)); TN = os.path.join(HERE, 'node_modules/three')

async def main():
    ap = argparse.ArgumentParser(); ap.add_argument('page'); ap.add_argument('acts'); ap.add_argument('--nobegin', action='store_true')
    ap.add_argument('--w', type=int, default=1280); ap.add_argument('--h', type=int, default=720); ap.add_argument('--out', default='/tmp/probe')
    ap.add_argument('--pre', default='')
    a = ap.parse_args(); os.makedirs(a.out, exist_ok=True)
    acts = []
    for ln in open(a.acts if os.path.isabs(a.acts) else os.path.join(HERE, a.acts)):
        ln = ln.rstrip('\n')
        if '|' in ln and not ln.startswith('#'):
            t, js = ln.split('|', 1); acts.append((float(t), js))
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--mute-audio', '--autoplay-policy=no-user-gesture-required'])
        ctx = await b.new_context(viewport={'width': a.w, 'height': a.h})
        page = await ctx.new_page(); page.set_default_timeout(900000)
        page.on('pageerror', lambda e: print('[pageerror]', str(e)[:300]))
        page.on('console', lambda m: print('[c]', m.text[:300]) if m.type == 'error' or m.text.startswith('PROBE') else None)
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
        await page.goto('http://localhost:8123/' + a.page, wait_until='load', timeout=300000)
        await page.wait_for_function("(()=>{const b=document.getElementById('pgStart');return b&&!b.disabled})()", timeout=900000, polling=500)
        if not a.nobegin: await page.evaluate("document.getElementById('pgStart').click()")
        t = 0.0
        for T, js in acts:
            if T > t: await asyncio.sleep(T - t); t = T
            try:
                if js.startswith('@shot'):
                    await page.screenshot(path=os.path.join(a.out, js.split()[1] + '.png')); print(f'{T}: shot {js.split()[1]}')
                else:
                    r = await page.evaluate(js); print(f'{T}: {str(r)[:40000]}')
            except Exception as e: print(f'{T}: ERR {str(e)[:400]}')
        await b.close()
asyncio.run(main())
