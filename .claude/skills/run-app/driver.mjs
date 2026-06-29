// Prospector local run + drive harness — see SKILL.md.
// Serves the repo over HTTP and drives the Leaflet map with the already-cached Playwright
// Chromium. No build step, no dev server. Network is required (claims/mines/ownership load
// live from public BLM/USGS ArcGIS services).
//
// playwright-core is imported by absolute path from a stable cache dir so nothing has to be
// installed inside the repo. Install it once with:
//   mkdir -p ~/.prospector-run && cd ~/.prospector-run && npm i playwright-core
//
// Env knobs: CENTER="lat,lng"  ZOOM=n  BASE=streets|imagery|topo  SHOT=path  PORT=n
//            PW_DIR=<dir containing node_modules/playwright-core>  ROOT=<repo root override>
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = process.env.ROOT || path.resolve(HERE, '../../..');   // repo root (…/Prospector/Prospector)
const PORT = Number(process.env.PORT || 8099);
const SHOT = process.env.SHOT || path.join(process.cwd(), 'prospector.png');
const CENTER = (process.env.CENTER || '39.2373,-105.3189').split(',').map(Number);
const ZOOM = Number(process.env.ZOOM || 14);
const BASE = process.env.BASE || '';

// --- import the driver library from a stable cache dir (not the repo) ---------------
const PW_DIR = process.env.PW_DIR || path.join(os.homedir(), '.prospector-run');
let chromium;
try {
  // playwright-core is CommonJS; via ESM dynamic import the `chromium` named export can
  // come through on the default export instead, so fall back to that.
  const pw = await import(pathToFileURL(path.join(PW_DIR, 'node_modules/playwright-core/index.js')).href);
  chromium = pw.chromium || (pw.default && pw.default.chromium);
  if (!chromium) throw new Error('no chromium export');
} catch {
  console.error('playwright-core not found. Run:\n  mkdir -p "' + PW_DIR + '" && cd "' + PW_DIR + '" && npm i playwright-core');
  process.exit(2);
}

// --- locate the cached Playwright Chromium (newest build) ---------------------------
function findChromium() {
  const root = path.join(os.homedir(), 'AppData/Local/ms-playwright');
  let best = null, bestN = -1;
  for (const d of (fs.existsSync(root) ? fs.readdirSync(root) : [])) {
    const m = d.match(/^chromium-(\d+)$/); if (!m) continue;
    for (const sub of ['chrome-win64/chrome.exe', 'chrome-win/chrome.exe']) {
      const exe = path.join(root, d, sub);
      if (fs.existsSync(exe) && +m[1] > bestN) { best = exe; bestN = +m[1]; }
    }
  }
  if (!best) throw new Error('No cached Chromium under ' + root + '. Run: npx playwright install chromium');
  return best;
}

// --- tiny static server for the repo root -------------------------------------------
const TYPES = { '.html':'text/html', '.js':'text/javascript', '.png':'image/png',
  '.webmanifest':'application/manifest+json', '.json':'application/json', '.css':'text/css', '.svg':'image/svg+xml' };
const server = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]); if (p === '/') p = '/index.html';
  fs.readFile(path.join(ROOT, p), (e, b) => {
    if (e) { res.writeHead(404); res.end('nf'); return; }
    res.writeHead(200, { 'content-type': TYPES[path.extname(p)] || 'application/octet-stream' });
    res.end(b);
  });
});
await new Promise(r => server.listen(PORT, r));

const EXE = findChromium();
const browser = await chromium.launch({ executablePath: EXE, headless: true });
const page = await browser.newPage({ viewport: { width: 900, height: 1000 } });
const errors = [];
page.on('pageerror', e => errors.push('PAGEERR: ' + e.message));
page.on('console', m => { if (m.type() === 'error') errors.push('CONSOLE: ' + m.text()); });

await page.goto(`http://localhost:${PORT}/index.html`, { waitUntil: 'load' });
// The app is a classic <script>, so its top-level bindings (map, refreshClaims, claimLayer,
// setBase, lowQlty, moreInfoLink, …) live in the page's global lexical scope and are usable
// directly inside page.evaluate — that is how we drive it.
await page.waitForFunction(() => typeof refreshClaims === 'function' && typeof map !== 'undefined' && map._loaded, { timeout: 15000 });

// ===== SCENARIO (edit this block for other checks) ==================================
await page.evaluate(async ({ c, z, base }) => {
  if (base && typeof setBase === 'function') setBase(base);
  map.setView(c, z);
  await refreshClaims();
}, { c: CENTER, z: ZOOM, base: BASE });
await page.waitForTimeout(2500);

const summary = await page.evaluate(() => {
  const o = { total: 0, dashed: 0, solid: 0, sampleDashed: [], sampleLink: null };
  claimLayer.eachLayer(l => {
    const p = l.feature.properties || {};
    const dash = l.options.dashArray || null;
    o.total++;
    if (dash) { o.dashed++; if (o.sampleDashed.length < 4) o.sampleDashed.push({ name: p.CSE_NAME, qlty: String(p.QLTY).slice(0, 8), dash }); }
    else o.solid++;
    if (!o.sampleLink) { const h = l.getPopup() && l.getPopup().getContent(); const m = h && h.match(/href="([^"]+)"/); if (m) o.sampleLink = { name: p.CSE_NAME, href: m[1] }; }
  });
  return o;
});
// ===================================================================================

await page.screenshot({ path: SHOT });
console.log(JSON.stringify({ ROOT, PORT, EXE, CENTER, ZOOM, summary, errors }, null, 2));
console.log('screenshot:', SHOT);
await browser.close();
server.close();