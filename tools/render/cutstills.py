"""Testing only: one still per cutscene shot, with the fake clock (shoot.py's).
   python3 cutstills.py URL OUTDIR --start JS --shots "0@1.5,1@3,2@2" [--pre JS] [--waitjs JS] [--settle 2]
   After the page loads and --start runs, --settle game seconds are stepped (no renders); then for each i@t the
   playing cutscene jumps to shot i (CUTS.jump), t game seconds are stepped, and one frame is rendered and saved as
   OUTDIR/sNN_t.jpg. "--shots run" instead plays the cutscene from where it is and saves one still per shot, t seconds
   into each (--into, default 1.5). Console errors go to OUTDIR/console.log; a summary line per still is printed."""
import asyncio, argparse, os, time, re
from playwright.async_api import async_playwright
import importlib.util
HERE = os.path.dirname(os.path.abspath(__file__))
TN = os.path.join(HERE, 'node_modules/three')
src = open(os.path.join(HERE, 'shoot.py')).read()
FAKE = re.search(r'FAKE = r"""(.*?)"""', src, re.S).group(1)
WRAP = re.search(r'WRAP = r"""(.*?)"""', src, re.S).group(1)

async def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('url'); ap.add_argument('out')
    ap.add_argument('--start', default="document.getElementById('pgStart').click()")
    ap.add_argument('--waitjs', default="(()=>{const b=document.getElementById('pgStart');return b&&!b.disabled})()")
    ap.add_argument('--pre', default='')
    ap.add_argument('--then', default='', help='JS run after --settle (start the cutscene you want)')
    ap.add_argument('--settle', type=float, default=1.0)
    ap.add_argument('--shots', default='run')
    ap.add_argument('--into', type=float, default=1.5)
    ap.add_argument('--maxlen', type=float, default=240)
    ap.add_argument('--w', type=int, default=960); ap.add_argument('--h', type=int, default=540)
    ap.add_argument('--mobile', action='store_true')
    a = ap.parse_args()
    os.makedirs(a.out, exist_ok=True)
    log = open(os.path.join(a.out, 'console.log'), 'w')
    errs = []
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required', '--mute-audio'])
        ctx = await b.new_context(viewport={'width': a.w, 'height': a.h}, device_scale_factor=1, is_mobile=a.mobile, has_touch=a.mobile)
        page = await ctx.new_page(); page.set_default_timeout(900000)
        def onc(m):
            if m.type in ('error',):
                log.write(f'[{m.type}] {m.text}\n'); errs.append(m.text)
            elif m.type == 'warning': log.write(f'[warn] {m.text}\n')
        page.on('console', onc)
        page.on('pageerror', lambda e: (log.write(f'[pageerror] {e}\n'), errs.append(str(e))))
        await page.add_init_script("try{for(const k of Object.keys(localStorage))if(/checkpoint|cp\\b|\\.cp/.test(k))localStorage.removeItem(k)}catch(e){}")
        await page.add_init_script(FAKE)
        if a.pre: await page.add_init_script(a.pre)
        async def route(route):
            u = route.request.url
            if 'three.min.js' in u or 'three@0.128.0/build/three' in u:
                return await route.fulfill(body=open(os.path.join(TN, 'build/three.min.js')).read() + WRAP, content_type='application/javascript')
            if 'three@0.128.0/examples/' in u:
                fp = os.path.join(TN, u.split('three@0.128.0/')[1].split('?')[0])
                if os.path.exists(fp): return await route.fulfill(path=fp, content_type='application/javascript')
            if 'fonts.googleapis' in u or 'fonts.gstatic' in u: return await route.fulfill(body='', content_type='text/css')
            return await route.continue_()
        await page.route('**/*', route)
        await page.goto(a.url, wait_until='load', timeout=120000)
        t0 = time.time()
        for i in range(80): await page.evaluate('__adv(50,false)'); await asyncio.sleep(0.01)
        if a.waitjs:
            while time.time() - t0 < 400:
                if await page.evaluate(a.waitjs): break
                await page.evaluate('__adv(50,false)'); await asyncio.sleep(0.05)
        if a.start: await page.evaluate(a.start)
        async def step(sec, render_last=False):
            n = max(1, int(round(sec / 0.05)))
            for k in range(n): await page.evaluate(f'__adv(50,{"true" if render_last and k == n-1 else "false"})')
        await step(a.settle)
        if a.then:
            r = await page.evaluate(a.then); log.write(f'[then] {r}\n')
            await step(.1)
        async def snap(name):
            await page.screenshot(path=os.path.join(a.out, name + '.jpg'), type='jpeg', quality=80)
        if a.shots == 'run':
            seen = -2; t = 0.0; into = 0.0
            while t < a.maxlen:
                sh = await page.evaluate('CUTS.shot')
                if sh < 0 and seen >= 0: break
                if sh != seen: seen = sh; into = 0.0; took = False
                if not took and into + 1e-6 >= a.into:
                    await page.evaluate('__adv(50,true)'); await snap(f's{sh:02d}_{t:05.1f}'); took = True
                    print('shot', sh, f'{t:.1f}', len(errs), 'errs', flush=True)
                else: await page.evaluate('__adv(50,false)')
                t += .05; into += .05
        else:
            for tok in a.shots.split(','):
                i, tt = tok.split('@'); i = int(i); tt = float(tt)
                await page.evaluate(f'CUTS.jump({i})')
                await step(tt, True); await snap(f's{i:02d}_{tt:04.1f}')
                print('shot', i, tt, await page.evaluate('CUTS.shot'), len(errs), 'errs', flush=True)
        log.write(f'[harness] real {time.time()-t0:.0f}s, {len(errs)} errors\n')
        await b.close()
    print('ERRORS', len(errs)); [print(' ', e[:200]) for e in errs[:8]]

asyncio.run(main())
