"""Trailer render driver: headless Chromium (software WebGL), three.js routed to the local npm copy.
usage: python3 drive.py URL OUTDIR --from 0 --to 50 --fps 30 [--w 1920 --h 1080] [--ready JS] [--frame JS-with-{t}] [--png]"""
import asyncio, argparse, os, time
from playwright.async_api import async_playwright
TN = os.path.join(os.path.dirname(os.path.abspath(__file__)), '../render/node_modules/three')
async def main():
    ap = argparse.ArgumentParser(); ap.add_argument('url'); ap.add_argument('out')
    ap.add_argument('--from', dest='t0', type=float, default=0); ap.add_argument('--to', dest='t1', type=float, default=1)
    ap.add_argument('--fps', type=float, default=30); ap.add_argument('--w', type=int, default=1920); ap.add_argument('--h', type=int, default=1080)
    ap.add_argument('--ready', default='window.TRAILER&&TRAILER.ready'); ap.add_argument('--frame', default='TRAILER.frame({t})')
    ap.add_argument('--png', action='store_true'); ap.add_argument('--times', default='')
    a = ap.parse_args(); os.makedirs(a.out, exist_ok=True); log = open(os.path.join(a.out, 'console.log'), 'a')
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--mute-audio'])
        ctx = await b.new_context(viewport={'width': a.w, 'height': a.h}, device_scale_factor=1)
        page = await ctx.new_page(); page.set_default_timeout(900000)
        page.on('console', lambda m: log.write(f'[{m.type}] {m.text}\n') if m.type in ('error', 'warning', 'log') else None)
        page.on('pageerror', lambda e: log.write(f'[pageerror] {e}\n'))
        async def route(route):
            u = route.request.url
            if 'three.min.js' in u or 'three@0.128.0/build/three' in u:
                return await route.fulfill(path=os.path.join(TN, 'build/three.min.js'), content_type='application/javascript')
            if 'three@0.128.0/examples/' in u:
                fp = os.path.join(TN, u.split('three@0.128.0/')[1].split('?')[0])
                if os.path.exists(fp): return await route.fulfill(path=fp, content_type='application/javascript')
            return await route.continue_()
        await page.route('**/*', route)
        await page.goto(a.url, wait_until='load', timeout=300000)
        t0 = time.time()
        while not await page.evaluate(a.ready):
            await asyncio.sleep(0.5)
            if time.time() - t0 > 900: log.write('[drive] ready timeout\n'); break
        log.write(f'[drive] ready after {time.time()-t0:.1f}s\n'); log.flush()
        times = [float(x) for x in a.times.split(',')] if a.times else [a.t0 + i / a.fps for i in range(int(round((a.t1 - a.t0) * a.fps)))]
        r0 = time.time()
        for i, t in enumerate(times):
            fi = int(round(t * a.fps))
            fn = os.path.join(a.out, f'f{fi:05d}.' + ('png' if a.png else 'jpg'))
            if os.path.exists(fn) and not a.times: continue
            await page.evaluate(a.frame.replace('{t}', f'{t:.5f}'))
            if a.png: await page.screenshot(path=fn, type='png')
            else: await page.screenshot(path=fn, type='jpeg', quality=94)
            if i % 15 == 0: log.write(f'[drive] {i}/{len(times)} t={t:.2f} {(time.time()-r0)/(i+1):.2f}s/frame\n'); log.flush()
        log.write(f'[drive] done {len(times)} frames in {time.time()-r0:.0f}s\n')
        await b.close()
asyncio.run(main())
