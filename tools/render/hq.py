"""Re-render the briefing backdrop from the command deck (origin.html deckIntro), color + packed depth."""
import asyncio, os, sys, time, base64, json
sys.path.insert(0, os.path.dirname(__file__))
from playwright.async_api import async_playwright
import importlib.util
spec = importlib.util.spec_from_file_location('shoot', os.path.join(os.path.dirname(__file__), 'shoot.py'))
src = open(os.path.join(os.path.dirname(__file__), 'shoot.py')).read().split('async def main')[0]
ns = {}; exec(src, ns)
FAKE, WRAP, TN = ns['FAKE'], ns['WRAP'], ns['TN']
OUT = sys.argv[1]; AT = float(sys.argv[2]) if len(sys.argv) > 2 else 6.0

HOOK = r"""
(()=>{const rf=window.renderFrame;window.renderFrame=function(){if(window.__HQ){camera.position.set(DECK.x-6.55,2.2,.255);camera.rotation.set(0,-Math.PI/2,0);camera.fov=62;camera.aspect=16/9;camera.updateProjectionMatrix();P.H.root.visible=false;}return rf.apply(this,arguments);};
window.__depth=()=>{const r=window.__renderers[0];const hid=[];scene.traverse(o=>{if(!o.visible)return;const m=o.material;
   if(o.isSprite||o.isPoints||o.isLine||(o.isMesh&&m&&!Array.isArray(m)&&m.transparent&&m.opacity<.1)){o.visible=false;hid.push(o);}});
  const dm=new THREE.MeshDepthMaterial({depthPacking:THREE.RGBADepthPacking,skinning:true});const ov=scene.overrideMaterial,bg=scene.background,fg=scene.fog;
  scene.overrideMaterial=dm;scene.background=new THREE.Color(1,1,1);scene.fog=null;const tm=r.toneMapping,oe=r.outputEncoding;r.toneMapping=THREE.NoToneMapping;r.outputEncoding=THREE.LinearEncoding;
  r.setRenderTarget(null);window.__render=true;r.render(scene,camera);
  const gl=r.getContext(),w=gl.drawingBufferWidth,h=gl.drawingBufferHeight,px=new Uint8Array(w*h*4);gl.readPixels(0,0,w,h,gl.RGBA,gl.UNSIGNED_BYTE,px);
  scene.overrideMaterial=ov;scene.background=bg;scene.fog=fg;r.toneMapping=tm;r.outputEncoding=oe;hid.forEach(o=>o.visible=true);
  let s='';for(let i=0;i<px.length;i+=32768)s+=String.fromCharCode.apply(null,px.subarray(i,i+32768));return{w,h,near:camera.near,far:camera.far,b64:btoa(s)};};
})();
"""

async def main():
    os.makedirs(OUT, exist_ok=True)
    log = open(os.path.join(OUT, 'console.log'), 'w')
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--mute-audio'])
        ctx = await b.new_context(viewport={'width': 1920, 'height': 1080}, device_scale_factor=1)
        page = await ctx.new_page()
        page.on('console', lambda m: log.write(f'[{m.type}] {m.text}\n') if m.type in ('error', 'warning') else None)
        page.on('pageerror', lambda e: log.write(f'[pageerror] {e}\n'))
        await page.add_init_script(FAKE)
        await page.add_init_script("try{localStorage.removeItem('elyra.checkpoint')}catch(e){}")
        async def route(route):
            u = route.request.url
            if 'three.min.js' in u:
                return await route.fulfill(body=open(os.path.join(TN, 'build/three.min.js')).read() + WRAP, content_type='application/javascript')
            if 'three@0.128.0/examples/' in u:
                fp = os.path.join(TN, u.split('three@0.128.0/')[1].split('?')[0])
                if os.path.exists(fp): return await route.fulfill(path=fp, content_type='application/javascript')
            if 'fonts.g' in u: return await route.fulfill(body='', content_type='text/css')
            return await route.continue_()
        await page.route('**/*', route)
        await page.goto('http://localhost:8123/origin.html', wait_until='load', timeout=120000)
        t0 = time.time()
        while time.time() - t0 < 400:
            ok = await page.evaluate("(()=>{const b=document.getElementById('pgStart');return b&&!b.disabled})()")
            if ok: break
            await page.evaluate('__adv(50,false)'); await asyncio.sleep(0.05)
        log.write(f'[hq] ready {time.time()-t0:.0f}s\n')
        await page.evaluate("PROLOGUE.play=cb=>cb();document.getElementById('pgStart').click();")
        await page.evaluate(HOOK)
        # let models settle while the intro runs
        t = 0.0
        while t < AT:
            await page.evaluate('__adv(50,false)'); t += 0.05
        await page.evaluate('window.__HQ=true')
        for i in range(3): await page.evaluate('__adv(50,true)')
        info = await page.evaluate("(()=>{const c=window.__renderers[0].domElement;return{w:c.width,h:c.height,url:c.toDataURL('image/png')}})()")
        open(os.path.join(OUT, 'color.png'), 'wb').write(base64.b64decode(info['url'].split(',')[1]))
        d = await page.evaluate('__depth()')
        open(os.path.join(OUT, 'depth.raw'), 'wb').write(base64.b64decode(d.pop('b64')))
        json.dump(d, open(os.path.join(OUT, 'depth.json'), 'w'))
        await page.screenshot(path=os.path.join(OUT, 'page.jpg'), type='jpeg')
        log.write(f'[hq] color {info["w"]}x{info["h"]} depth {d}\n')
        await b.close()
    log.close()

asyncio.run(main())
