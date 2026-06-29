---
name: run-app
description: Launch and drive the Prospector map app locally in a real headless browser to verify a change — claim squares/styling, popups, links, layers, search. Serves index.html and drives the Leaflet map with the already-cached Playwright Chromium. Use when asked to run, start, test, screenshot, or verify the Prospector app in a browser (not deploy — that's netlify-drop).
---

# Run / drive Prospector locally

Prospector is a single-file static PWA ([index.html](../../../index.html)) built on Leaflet. There is **no build step and no dev server** — you "run" it by serving the folder over HTTP and driving it with a headless browser. Claim, mine, land-ownership and geology data load **live from public BLM/USGS ArcGIS services**, so network is required (it works in this environment — plain `curl` reaches `gis.blm.gov`).

## Setup (once per machine)
Playwright's Chromium is already cached under `~/AppData/Local/ms-playwright` (the driver auto-discovers the newest build). You only need the driver library, installed in a stable cache dir **outside the repo**:

```bash
mkdir -p ~/.prospector-run && cd ~/.prospector-run && npm i playwright-core --no-audit --no-fund
```

## Run it
```bash
SHOT="<scratchpad>/shot.png" CENTER="39.2373,-105.3189" ZOOM=14 \
  node "c:/Users/robot/source/repos/Prospector/Prospector/.claude/skills/run-app/driver.mjs"
```
Then **Read the screenshot** and the printed JSON. The harness serves the repo root, launches the cached Chromium, waits for the map to finish loading, applies the view, calls `refreshClaims()`, and prints:
`{ summary: { total, dashed, solid, sampleDashed, sampleLink }, errors }` for the claim layer.

Env knobs: `CENTER="lat,lng"`, `ZOOM=n`, `BASE=streets|imagery|topo`, `SHOT=path`, `PORT=n`.

## How you drive it
The app is a classic `<script>`, so its top-level names live in the page's global lexical scope and are usable **directly inside `page.evaluate`**. The useful handles:
- `map` — the Leaflet map (`map.setView([lat,lng], z)`, `map.getBounds()`)
- `refreshClaims()` — fetch + render claims/plans (and mines if that layer is on) for the current view
- `claimLayer` / `planLayer` / `mineLayer` / `pinGroup` — the GeoJSON layers (`claimLayer.eachLayer(l => l.feature.properties / l.options.dashArray / l.getPopup().getContent())`)
- `setBase('streets'|'imagery'|'topo')`, and helpers `lowQlty(props)`, `moreInfoLink(props)`
Edit the `SCENARIO` block in `driver.mjs` for any other check (open a popup, toggle a layer, drive search, etc.).

## Known-good landmarks
- **Dashed (QLTY=0) claims** — `39.2373,-105.3189` (Arabian Nights #2/#3, Wigwam / Pike NF). Good for verifying the dashed-vs-solid border styling.
- **"The Faire Claire of Ere"** — `40.7684,-105.5946` (Red Feather Lakes).
- Claims only load at zoom ≥ 10; the moveend auto-refresh fires at zoom ≥ 11.

## Notes
- A lone `404` console message is a benign PWA icon/asset — not app logic.
- Deploying the site is the separate **netlify-drop** skill, not this one.