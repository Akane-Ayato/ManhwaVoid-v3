/**
 * Vercel Edge Function (api/proxy.ts, reached via the /api/v1/* rewrite in vercel.json): same-origin reverse proxy to the real API.
 *
 * The browser only ever talks to  https://<your-site>/api/v1/...  and never learns where the API lives.
 * The real address comes from the server-side env var BACKEND_URL (no VITE_ prefix, so it is never bundled
 * into the JavaScript that is shipped to visitors).
 *
 *   BACKEND_URL           required  e.g. https://my-api.onrender.com   (no trailing /api/v1)
 *   BACKEND_PROXY_SECRET  optional  sent as the "x-proxy-secret" header so the API can reject direct traffic
 */
export const config = { runtime: 'edge' };

const ALLOWED_PREFIX = '/api/v1/';
const TIMEOUT_MS = 30_000;

/** Request headers that are forwarded. Everything else (cookies, host, vercel/internal headers) is dropped. */
const FORWARD = ['accept', 'accept-language', 'authorization', 'content-type', 'content-length', 'if-none-match', 'if-modified-since', 'range', 'user-agent'];
/** Response headers that would reveal or break the proxy setup. */
const STRIP = ['server', 'x-powered-by', 'via', 'content-encoding', 'content-length', 'transfer-encoding', 'connection', 'alt-svc', 'access-control-allow-origin', 'access-control-allow-credentials', 'access-control-allow-headers', 'access-control-allow-methods', 'access-control-expose-headers', 'strict-transport-security'];

const json = (status: number, message: string) =>
  new Response(JSON.stringify({ success: false, data: null, error: { code: `HTTP_${status}`, message } }), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  });

export default async function handler(req: Request): Promise<Response> {
  const base = (process.env.BACKEND_URL || '').trim().replace(/\/+$/, '');

  const url = new URL(req.url);
  // vercel.json rewrites /api/v1/* to this function. The original path is normally preserved in req.url;
  // fall back to the ?path= query value if the platform hands us the rewritten URL instead.
  let pathname = url.pathname;
  const params = new URLSearchParams(url.search);
  if (!pathname.startsWith(ALLOWED_PREFIX)) {
    const p = params.get('path');
    pathname = p !== null ? ALLOWED_PREFIX + p.replace(/^\/+/, '') : pathname;
  }
  params.delete('path');
  const search = params.toString() ? `?${params.toString()}` : '';

  // Self-check for setup problems: GET /api/v1/_proxy-status  (booleans only, reveals nothing)
  if (pathname === `${ALLOWED_PREFIX}_proxy-status`) {
    return new Response(JSON.stringify({ proxy: 'ok', backendConfigured: !!base, secretConfigured: !!process.env.BACKEND_PROXY_SECRET }), {
      headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
    });
  }
  if (!base) return json(503, 'Service is not configured.');
  if (!pathname.startsWith(ALLOWED_PREFIX) || pathname.includes('..')) return json(404, 'Not found.');
  if (req.method === 'OPTIONS') return new Response(null, { status: 204 }); // same-origin: no CORS needed

  const headers = new Headers();
  for (const h of FORWARD) { const v = req.headers.get(h); if (v) headers.set(h, v); }
  const ip = req.headers.get('x-real-ip') || req.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  if (ip) headers.set('x-forwarded-for', ip); // keeps the API's per-IP rate limits meaningful
  const secret = process.env.BACKEND_PROXY_SECRET;
  if (secret) headers.set('x-proxy-secret', secret);

  const hasBody = !['GET', 'HEAD'].includes(req.method);
  let upstream: Response;
  try {
    upstream = await fetch(base + pathname + search, {
      method: req.method,
      headers,
      body: hasBody ? req.body : undefined,
      redirect: 'manual',
      signal: AbortSignal.timeout(TIMEOUT_MS),
      // @ts-expect-error `duplex` is required by the Fetch spec for streamed bodies but is missing from some lib typings
      duplex: hasBody ? 'half' : undefined,
    });
  } catch {
    return json(502, 'The service is temporarily unavailable. Please try again.'); // never echo the underlying error
  }

  const out = new Headers(upstream.headers);
  STRIP.forEach((h) => out.delete(h));
  const loc = out.get('location');
  if (loc) out.set('location', loc.split(base).join(''));
  out.set('x-content-type-options', 'nosniff');

  // JSON/text may contain absolute URLs to the API itself (e.g. avatars): make them relative so the origin never leaks.
  const type = upstream.headers.get('content-type') || '';
  if (/json|text|xml/i.test(type)) {
    const text = (await upstream.text()).split(base).join('');
    return new Response(text, { status: upstream.status, headers: out });
  }
  return new Response(upstream.body, { status: upstream.status, headers: out });
}
