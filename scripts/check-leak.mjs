// Runs after `npm run build`. Fails the build if the real API address ended up in the shipped files.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const secret = (process.env.BACKEND_URL || '').trim().replace(/\/+$/, '');
const forbidden = [];
if (secret) { forbidden.push(secret); try { forbidden.push(new URL(secret).host); } catch { /* not a URL */ } }
if (process.env.BACKEND_PROXY_SECRET) forbidden.push(process.env.BACKEND_PROXY_SECRET);
if (/^https?:\/\//i.test(process.env.VITE_API_BASE_URL || '') && process.env.VITE_ALLOW_DIRECT_API !== '1') {
  console.error('✖ VITE_API_BASE_URL is an absolute URL, which would expose your API. Remove it (use the /api/v1 proxy).');
  process.exit(1);
}

const hits = [];
const walk = (d) => {
  for (const f of readdirSync(d)) {
    const p = join(d, f);
    if (statSync(p).isDirectory()) walk(p);
    else if (/\.(js|css|html|json|webmanifest|txt|map)$/.test(f)) {
      const t = readFileSync(p, 'utf8');
      for (const s of forbidden) if (s && t.includes(s)) hits.push(`${p}  contains  ${s === process.env.BACKEND_PROXY_SECRET ? '[proxy secret]' : s}`);
    }
  }
};
walk('dist');
if (hits.length) { console.error('✖ Backend address leaked into the build:\n' + hits.join('\n')); process.exit(1); }
console.log(secret ? '✔ Leak check passed: the API address is not in dist/.' : '✔ Leak check: no BACKEND_URL set locally (nothing to compare); API base is relative.');
