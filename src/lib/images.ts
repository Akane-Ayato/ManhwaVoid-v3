import { API_ORIGIN } from '../config';
import { storage } from './storage';
import type { ImageAsset } from '../types/api';

/** Accepts an ImageAsset, a string, or nothing; returns an absolute-or-same-origin URL ('' if none). */
export function imageUrl(asset?: ImageAsset | string | null): string {
  const raw = typeof asset === 'string' ? asset : asset?.url;
  if (!raw) return '';
  if (raw.startsWith('//')) return `https:${raw}`;
  if (raw.startsWith('/')) return `${API_ORIGIN}${raw}`; // e.g. /api/v1/static/avatars/x.jpg
  return raw;
}

/**
 * The reader endpoint doesn't return a cover, but reading history needs one.
 * Remember covers of every card we render so the reader can send it along.
 */
const COVER_KEY = 'mhq_covers';
const MAX_COVERS = 300;
let covers: Record<string, string> | null = null;
let flushTimer: number | undefined;

const load = () => (covers ??= storage.getJSON<Record<string, string>>(COVER_KEY, {}));

export function rememberCover(slug: string, url: string) {
  if (!slug || !url) return;
  const map = load();
  if (map[slug] === url) return;
  map[slug] = url;
  const keys = Object.keys(map);
  if (keys.length > MAX_COVERS) keys.slice(0, keys.length - MAX_COVERS).forEach((k) => delete map[k]);
  window.clearTimeout(flushTimer);
  flushTimer = window.setTimeout(() => storage.setJSON(COVER_KEY, map), 500);
}

export const recallCover = (slug: string): string | null => load()[slug] ?? null;
