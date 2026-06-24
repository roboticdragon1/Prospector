---
name: netlify-drop
description: Deploy the Prospector static site to Netlify and return a live URL to view it. The terminal equivalent of dragging the folder onto app.netlify.com/drop. Use when the user asks to "drop", "deploy", "publish", or "push the site to Netlify".
---

# netlify-drop

Deploys the Prospector folder (the static PWA: `index.html`, `manifest.webmanifest`,
`sw.js`, icons) to Netlify and prints a live URL the user can open.

`app.netlify.com/drop` is a browser drag-and-drop page that can't be automated from a
terminal. The Netlify CLI's `deploy` command does the exact same thing — uploads a folder
and returns a hosted URL — so this skill uses that.

## What to deploy

The site root is the repository root (where `index.html` lives). There is no build step —
deploy the files as-is.

## Steps

Run everything with `npx netlify-cli@latest` so no global install is required.

### 1. Check authentication

```bash
npx netlify-cli@latest status
```

- If it reports a logged-in account, continue.
- If not logged in:
  - Prefer a token: if `NETLIFY_AUTH_TOKEN` is set in the environment, the CLI uses it
    automatically — re-run `status` to confirm.
  - Otherwise tell the user to either set `NETLIFY_AUTH_TOKEN` (create one at
    https://app.netlify.com/user/applications#personal-access-tokens) or run
    `npx netlify-cli@latest login` themselves once (it opens a browser to authorize).
    Do **not** try to run `login` yourself — it requires interactive browser auth.

### 2. Deploy

Check whether a site is already linked (a `.netlify/state.json` file exists in the repo).

**If no site is linked yet** — create one, then deploy to production:

```bash
npx netlify-cli@latest deploy --dir . --prod
```

When run without a linked site this is interactive (it asks to create/link a site), which
won't work non-interactively. So instead create the site explicitly first:

```bash
npx netlify-cli@latest sites:create --name prospector-<short-random-suffix>
npx netlify-cli@latest deploy --dir . --prod
```

Pick a unique suffix (e.g. a few random chars) since Netlify site names are global. The
`sites:create` step links the site and writes `.netlify/state.json`, so future deploys
reuse the same site.

**If a site is already linked** — just deploy to production:

```bash
npx netlify-cli@latest deploy --dir . --prod
```

### 3. Report the URL

The deploy output includes a **Website URL** (production) and a unique deploy URL. Quote
the production Website URL back to the user as a clickable link so they can view the site.

## Notes

- `.netlify/` holds the local site link. Add it to `.gitignore` if it isn't already, so the
  link isn't committed.
- Re-running the skill redeploys to the same site (the URL stays stable). To get a brand-new
  site instead, delete `.netlify/state.json` (or pass a fresh `sites:create --name`) before
  deploying.
- For a throwaway preview without touching production, drop `--prod` — the CLI returns a
  temporary draft deploy URL.