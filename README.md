# Prospector — setup (about 2 minutes)

A field web app that shows whether the ground under your GPS is **open**, **claimed**, or under an **active mining operation**, with geology, USGS/OSM basemaps, photo note-pins, and offline support. Data comes live from the BLM's official Mineral & Land Records System (MLRS) — the same source The Diggings uses.

## Using it in the field
- **🔍 Search** — tap the magnifying glass in the right-side button stack to find roads, towns, trails, peaks, and other places, plus mine sites and claims by name. Local layers (claims, operations, mine sites) match instantly and work offline; roads/places/POIs (OpenStreetMap Nominatim) and named trails/tracks (Overpass) need a connection and are biased to the area on screen. Tap a result to jump there — trails highlight their full path.
- **Crosshair (◎)** — start/stop GPS. The top banner turns green (open), amber (active claim), or red (active operation) based on the claim polygons loaded for your area. **Tap the banner** to verify the exact spot at the BLM.
- **⟳ Claims** — refresh claims for the area on screen. Claims auto-load when you pan while zoomed in and online.
- **📍** — drop-pin mode: tap the map to log a note + photos.
- **⤓** — **Save this area offline** *before* you lose signal. Stay zoomed to your trip area, then save. Afterward the map, ownership, and claims still work with no service.
- **▤** — layers & legend: toggle claims, active operations, **land ownership**, geology, and your pins. This sheet also has **Verify this spot at the BLM**.
- **Long-press the crosshair** — back up / restore your notes.

## Land ownership layer (new)
Toggle **Land ownership** in the layers sheet to shade the map by who manages the surface — BLM (yellow), US Forest Service (green), Park Service, Fish & Wildlife, Tribal/BIA, State, DoD, and **Private or unknown** (no federal fill). Source: BLM's National Surface Management Agency (SMA) dataset. Treat the boundaries as a guide, not a survey — it shows *surface* management and does not resolve split-estate (where someone else owns the minerals under federal surface, or vice versa).

## Important limits (please read)
- Claim **squares are approximate** — they cover the claim's PLSS section area and are often larger than the actual claimed ground. The app's status check is only as precise as those polygons.
- The BLM data can lag real status changes. **Before doing anything that depends on a claim being open or closed, verify directly with the BLM** (MLRS / the local field office). This app is for situational awareness, not a legal determination of where you may go.
- "Open ground" here only means *no active BLM mining claim at your point*. It does **not** account for private land, wilderness, withdrawals, special closures, or other restrictions. Cross-check land status separately.
- Geology overlay is generalized (USGS-derived via Macrostrat), good for context, not for precise contacts.

## Swapping data sources (optional, for later)
In `index.html`, the `ENDPOINTS` object holds the BLM claim/plans query URLs, and `BASE` holds the basemaps. The geology overlay URL is the Macrostrat tile line. You can point these at USGS SGMC WMS or other ArcGIS services if you'd rather.
