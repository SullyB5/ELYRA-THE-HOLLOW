# Cloud render harness (testing only, not loaded by the game)

Headless Chromium (software WebGL) with a fake clock: the page's setTimeout/setInterval/rAF/performance.now are stepped 50 ms at a
time, and renders are skipped except on capture frames, so cutscenes play out deterministically even at 1 fps.
three.js CDN requests are routed to a local `npm i three@0.128.0` (run it in this folder).

    python3 -m http.server 8123          # from the repo root
    python3 shoot.py "http://localhost:8123/index.html?watch=4&unlock=1" out/reel4 --every 1.5 --len 240 \
      --waitjs "typeof FOOTAGE!=='undefined'" --start "window.ELYRA_FOOTAGE(4)" --until "!FOOTAGE.on"
    python3 shoot.py "http://localhost:8123/tide-city.html" out/tideA --every 2 --len 92 \
      --waitjs "(()=>{const b=document.getElementById('pgStart');return b&&!b.disabled})()" \
      --start "document.getElementById('pgStart').click()" --acts tide_a.acts
    python3 sheet.py out/reel4 out/sheet.jpg 5 0 60 320   # contact sheet
    python3 hq.py out/hq 6                               # briefing backdrop: color.png + packed depth (depth.raw/json)

`*.acts`: lines `T|js`, run when game time reaches T (camera overrides go through `window.__CAM`, hooked into `renderFrame`).
About 4-5 s of real time per game second on a 2-CPU box. Run one browser at a time.
