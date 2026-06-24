# Prospector — setup (about 2 minutes)

A field web app that shows whether the ground under your GPS is **open**, **claimed**, or under an **active mining operation**, with geology, USGS/OSM basemaps, photo note-pins, and offline support. Data comes live from the BLM's official Mineral & Land Records System (MLRS) — the same source The Diggings uses.

## Why it needs hosting
GPS, the camera, offline tile caching, and "install to home screen" all require the app to be served over **HTTPS**. It can't run those from a file on your phone or from inside a chat window. Hosting it once on a free static host fixes that. You don't write any code.

## Easiest option — Netlify Drop (no account needed to try)
1. Go to https://app.netlify.com/drop
2. Drag the whole **`prospector` folder** onto the page.
3. It gives you a URL like `https://something.netlify.app`. Open it on your phone.
4. iPhone: Share → **Add to Home Screen**. Android: menu → **Install app / Add to Home Screen**.

That's it — it now opens like a normal app.

## Other free hosts (if you prefer)
- **GitHub Pages**: create a repo, upload these files, enable Pages on the main branch.
- **Cloudflare Pages** / **Vercel**: drag-and-drop or connect a repo. All free for this.

## Using it in the field
- **Crosshair (◎)** — start/stop GPS. The top banner turns green (open), amber (active claim), or red (active operation) based on the claim polygons loaded for your area. **Tap the banner** to verify the exact spot at the BLM.
- **⟳ Claims** — refresh claims for the area on screen. Claims auto-load when you pan while zoomed in and online.
- **📍** — drop-pin mode: tap the map to log a note + photos.
- **⤓** — **Save this area offline** *before* you lose signal. Stay zoomed to your trip area, then save. Afterward the map, ownership, and claims still work with no service.
- **▤** — layers & legend: toggle claims, active operations, **land ownership**, geology, and your pins. This sheet also has **Verify this spot at the BLM**.
- **Long-press the crosshair** — back up / restore your notes.

## Land ownership layer (new)
Toggle **Land ownership** in the layers sheet to shade the map by who manages the surface — BLM (yellow), US Forest Service (green), Park Service, Fish & Wildlife, Tribal/BIA, State, DoD, and **Private or unknown** (no federal fill). Source: BLM's National Surface Management Agency (SMA) dataset. Treat the boundaries as a guide, not a survey — it shows *surface* management and does not resolve split-estate (where someone else owns the minerals under federal surface, or vice versa).

## "Are active claims being missed?" — read this
The orange squares are **active claims only**. Two things they will *not* show, by design or limitation:
1. **Closed/historic named mines.** A site like the **Rainbow Lode** at Red Feather Lakes is a USGS record marked *closed*, so it isn't an active-claim square — on this app or on The Diggings' active filter. But that same ground can still be actively claimed under a *different owner's* claim name. Don't read "no square on the old mine name" as "open."
2. **Ungeocoded cases.** The BLM notes some claim cases can't be mapped to a location and have no geometry, so they appear in *no* polygon layer anywhere.

That's why the app has **Verify this spot at the BLM** (in the layers sheet, or tap the GPS banner): it shows your coordinates and links to the official BLM MLRS claim records and The Diggings so you can confirm the real status before relying on it.

## Important limits (please read)
- Claim **squares are approximate** — they cover the claim's PLSS section area and are often larger than the actual claimed ground. The app's status check is only as precise as those polygons.
- The BLM data can lag real status changes. **Before doing anything that depends on a claim being open or closed, verify directly with the BLM** (MLRS / the local field office). This app is for situational awareness, not a legal determination of where you may go.
- "Open ground" here only means *no active BLM mining claim at your point*. It does **not** account for private land, wilderness, withdrawals, special closures, or other restrictions. Cross-check land status separately.
- Geology overlay is generalized (USGS-derived via Macrostrat), good for context, not for precise contacts.

## Swapping data sources (optional, for later)
In `index.html`, the `ENDPOINTS` object holds the BLM claim/plans query URLs, and `BASE` holds the basemaps. The geology overlay URL is the Macrostrat tile line. You can point these at USGS SGMC WMS or other ArcGIS services if you'd rather.
