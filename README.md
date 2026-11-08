# Manhwa Void — Frontend

React 18 + Vite + TypeScript frontend for the Manhwa Void API (v0.5.0 contract).

## Run

```bash
npm install
cp .env.example .env.local   # optional; defaults work with the API on :8000
npm run dev                  # http://localhost:5173
```

In dev, Vite proxies `/api` to `http://127.0.0.1:8000`, so **no CORS setup is needed**. Start the API first
(`uvicorn app.main:app --port 8000`). Account features need MongoDB on the API side.

## Production

```bash
npm run build      # outputs dist/
```

Serve `dist/` from any static host with an SPA rewrite to `index.html` (`public/_redirects` is included for Netlify/Cloudflare).
If the API is on another domain, set `VITE_API_BASE_URL=https://api.example.com/api/v1` at build time and add the
site's origin to the API's `CORS_ORIGINS`. If you serve both behind one domain (Nginx: `/api` -> uvicorn), keep the default `/api/v1`.

## Structure

```
src/
  config.ts            site name/logo, API base, constants
  types/api.ts         types mirroring the API models
  lib/http.ts          axios, envelope + pagination unwrap, single-flight token refresh, ApiError
  lib/api.ts           one function per endpoint (+ small TTL cache)
  lib/{format,images,readState,storage,cache}.ts
  context/             Auth, Bookmarks, Theme, Toast
  hooks/               useAsync, useDebounce, useDismiss, useDocumentTitle
  components/          Header, SearchBox, MangaCard, Pagination, States, ...
  pages/               Home, Browse, Title, Reader, Auth, PublicProfile, profile/*
  styles/              base, layout, cards, pages, reader, profile (plain CSS, dark + light)
reference/             your original reference captures (not shipped in the build)
```

## Routes

`/` · `/browse?q=&genre=&type=&sort=&page=` · `/title/:slug` · `/title/:slug/chapter/:n` · `/login` · `/register` ·
`/profile?tab=summary|bookmark|history|notifications|export|settings` · `/user/:username`
(old `/read/:slug/:n`, `/search`, `/history`, `/library` redirect.)

## API usage notes

- Home: 1 request (`/home`), cached 2 min. "Load More" pages `/browse?sort=latest`.
- Browse: uses `pagination.total/total_pages` for "Showing 1 - 24 of N" and numbered pages. Header search shows live suggestions via `/search`.
- Title: 1 request (`/manga/{slug}` already includes chapters and related); the chapters/recommendations endpoints are fallbacks.
- Reader: `GET /manga/{slug}/chapters/{n}` also records history on the API for signed-in users (30/min limit), so it is never prefetched. The frontend then POSTs `/users/me/history` once to attach the **cover**, which the reader endpoint does not send.
- Tokens: a 401 triggers one shared refresh, then the request is retried; a failed refresh signs the user out.
- Changing the password signs you out (the API revokes all sessions).

## Known gaps (API-limited)

- `min chapters` / `min score` filters are applied to the loaded page only; `/browse` has no such parameters.
- Browse/search cards have no `type` from the API, so the Manga/Manhwa/Manhua badge shows on home/related cards and when a type filter is active. One-line fix in the API: add `"type": item.get("type")` in `normalize_source_card`.
- No comments, import, per-user ratings or server-side reading-progress endpoints exist, so those parts of the original UI are omitted. Scroll progress is stored locally.


## Branding
- Name: `src/config.ts` (or `VITE_SITE_NAME`). Logo = emblem (`public/logo-mark.png`) + a text wordmark (`components/Logo.tsx`).
- Icons are generated from your emblem: `favicon.ico`, `favicon-16/32/48.png`, `apple-touch-icon.png`, `icons/` (192/512, maskable, Windows tile), `og-image.png`.

## Installable app (PWA)
`public/manifest.webmanifest` + `public/sw.js` + `public/offline.html`.
- **Windows / Linux / macOS / Android** (Chrome, Edge, Brave): an "Install app" button appears in the header, menu and footer.
- **iOS / iPadOS** (Safari): Share → Add to Home Screen (the menu shows this hint). The `apple-*` meta tags are set.
- Installing and the service worker require **HTTPS or `localhost`**. Opening the dev server by LAN IP (`http://192.168.x.x:5173`) will *not* offer install. Deploy over HTTPS to test on phones.
- The service worker is only registered in production builds (`npm run build && npm run preview`), never caches `/api`, and shows an offline page when there's no network.
- When you know your domain, make `og:image` in `index.html` an absolute URL so social previews work.


## v1.2.0 notes
- **Logo:** book-and-roses emblem (your artwork) + Cinzel Decorative chrome/violet wordmark (`public/fonts`, `.logo-text` in `layout.css`). Icons are regenerated from the emblem.
- **Install button:** always visible; uses the native prompt when the browser provides one, otherwise shows platform-specific steps (Windows/Linux/macOS/Android/iOS). Native prompts need HTTPS or localhost.
- **Vercel:** see `DEPLOYMENT.md`. The API is reached only through `api/proxy.ts`; set `BACKEND_URL` as a server-side env var.
