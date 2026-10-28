"""Testing only: open a level, press Begin, then run each step and save a screenshot.
   python3 snap.py "origin.html?at=below" OUTDIR steps.json
   steps.json: [["name", "js run before the shot (may set window.__CAM)"], ...]
   window.__CAM (if set) runs every frame just before render, so it can pin the camera. Needs: python3 -m http.server 8123 at the repo root."""
import asyncio, json, os, sys, time
from playwright.async_api import async_playwright
TN = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'node_modules/three')
URL, OUT, STEPS = sys.argv[1], sys.argv[2], json.load(open(sys.argv[3]))
W, H = 1100, 620

HOOK = """(()=>{const rf=window.renderFrame;if(!rf||rf.__h)return 'nohook';const f=function(){if(window.__CAM)try{window.__CAM()}catch(e){console.error('cam',e)};return rf.apply(this,arguments)};f.__h=1;window.renderFrame=f;return 'hooked'})()"""

async def main():
    os.makedirs(OUT, exist_ok=True)
    log = open(os.path.join(OUT, 'console.log'), 'w')
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--mute-audio'])
        page = await (await b.new_context(viewport={'width': W, 'height': H})).new_page()
        page.set_default_timeout(300000)
        page.on('console', lambda m: log.write(f'[{m.type}] {m.text}\n') if m.type in ('error', 'warning') else None)
        page.on('pageerror', lambda e: (log.write(f'[pageerror] {e}\n'), print('PAGEERROR', e)))
        await page.add_init_script("try{localStorage.removeItem('elyra.checkpoint')}catch(e){}")
        async def route(r):
            u = r.request.url
            if 'three.min.js' in u: return await r.fulfill(path=os.path.join(TN, 'build/three.min.js'), content_type='application/javascript')
            if 'three@0.128.0/examples/' in u:
                fp = os.path.join(TN, u.split('three@0.128.0/')[1].split('?')[0])
                if os.path.exists(fp): return await r.fulfill(path=fp, content_type='application/javascript')
            if 'fonts.g' in u: return await r.fulfill(body='', content_type='text/css')
            return await r.continue_()
        await page.route('**/*', route)
        await page.goto('http://localhost:8123/' + URL, wait_until='load', timeout=120000)
        await page.wait_for_function("(()=>{const b=document.getElementById('pgStart');return b&&!b.disabled})()", timeout=300000)
        await page.evaluate("document.getElementById('pgStart').click()")
        await page.wait_for_timeout(6000)
        print('hook', await page.evaluate(HOOK))
        for name, js in STEPS:
            t = time.time()
            try: r = await page.evaluate(js)
            except Exception as e: r = 'ERR ' + str(e)[:300]
            await page.wait_for_timeout(1800)
            await page.screenshot(path=os.path.join(OUT, name + '.jpg'), type='jpeg', quality=70)
            print(name, json.dumps(r)[:300] if r is not None else '', f'{time.time()-t:.1f}s', flush=True)
        await b.close()
asyncio.run(main())
