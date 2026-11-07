# Deploying Manhwa Void on Vercel (API address stays private)

## How the API stays hidden

```
Browser ──► https://your-site.vercel.app/api/v1/...      (same origin, nothing else is ever visible)
                 │
                 ▼  api/[...path].ts  (Vercel Edge Function, runs on Vercel's servers)
            BACKEND_URL  ──►  your real FastAPI server
```

* The frontend only calls the relative path `/api/v1`. The real address lives in the server-side
  environment variable `BACKEND_URL`, which has no `VITE_` prefix, so Vite never puts it in the bundle.
* The proxy only forwards `/api/v1/*`, drops cookies and internal headers, hides upstream error details,
  strips `Server`/`X-Powered-By`, and rewrites any absolute API URLs in responses to relative ones.
* `npm run build` runs `scripts/check-leak.mjs`, which **fails the build** if `BACKEND_URL` (or the proxy
  secret) appears anywhere in `dist/`, or if `VITE_API_BASE_URL` is an absolute URL.
* Because requests are same-origin, you do not need CORS on the API for the Vercel site.

## Steps

1. Push this folder to a Git repository (GitHub/GitLab/Bitbucket).
2. Vercel → **Add New → Project** → import it. Framework preset: **Vite** (detected from `vercel.json`).
3. **Settings → Environment Variables** (Production, Preview, Development):
   | Name | Value |
   |---|---|
   | `BACKEND_URL` | `https://your-api-host.example.com` (origin only) |
   | `BACKEND_PROXY_SECRET` | optional random string (see below) |
4. Deploy. Test: open `https://<site>/api/v1/health` (or any GET endpoint) – it should return the API's JSON.
5. Install testing: the deployed site is HTTPS, so the browser install prompt works on Windows, Linux,
   macOS and Android; iOS uses Share → Add to Home Screen.

Changing `BACKEND_URL` requires a redeploy.

## Lock the API so only your Vercel site can use it (recommended)

Hiding the URL stops casual discovery, but anyone who finds the real host could still call it directly.
Set the same `BACKEND_PROXY_SECRET` on the API and reject requests that lack the header. For FastAPI:

```python
# app/main.py
import os
from fastapi import Request
from fastapi.responses import JSONResponse

PROXY_SECRET = os.getenv("BACKEND_PROXY_SECRET")

@app.middleware("http")
async def require_proxy_secret(request: Request, call_next):
    if PROXY_SECRET and request.url.path.startswith("/api/") \
            and request.headers.get("x-proxy-secret") != PROXY_SECRET:
        return JSONResponse({"success": False, "message": "Forbidden"}, status_code=403)
    return await call_next(request)
```

Also: turn off the API's `/docs` and `/openapi.json` in production (`FastAPI(docs_url=None, redoc_url=None, openapi_url=None)`),
and keep the API's per-IP rate limit; the proxy forwards the visitor IP in `x-forwarded-for`
(make uvicorn trust it with `--proxy-headers --forwarded-allow-ips="*"`).

## What can still be seen

Anyone can open DevTools → Network and see requests to `https://<your-site>/api/v1/...`. That is the proxy's
public face and is expected. They cannot see your backend host, its IP, or the secret.
Image CDN URLs (cover art hosts) are part of the data and are visible by nature.

## Local production test

```
BACKEND_URL=http://127.0.0.1:8000 npm run build   # leak check runs automatically
npx vercel dev                                      # runs the site + the api/ proxy locally
```
