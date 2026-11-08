/**
 * Central place for everything that is deployment- or brand-specific.
 * Change these via .env (see .env.example) instead of editing components.
 */
export const SITE = {
  name: import.meta.env.VITE_SITE_NAME || 'Manhwa Void',
  /** Circular emblem used in the header, footer and auth pages. */
  mark: '/logo-mark.png',
  tagline: 'Read your favorite Manga, Manhwa, Manhua and Webtoons online.',
};

/** Full API prefix. Relative ("/api/v1") works with the Vite dev proxy and same-origin deploys. */
const RAW_BASE = (import.meta.env.VITE_API_BASE_URL || '/api/v1').replace(/\/+$/, '');
/** Production always uses the same-origin proxy (api/proxy.ts) so the real API address is never shipped to browsers. */
export const API_BASE = import.meta.env.PROD && /^https?:\/\//i.test(RAW_BASE) && import.meta.env.VITE_ALLOW_DIRECT_API !== '1' ? '/api/v1' : RAW_BASE;

/** Origin that serves API-relative assets such as /api/v1/static/avatars/x.jpg */
export const API_ORIGIN = /^https?:\/\//i.test(API_BASE) ? new URL(API_BASE).origin : '';

export const MANGA_TYPES = ['Manga', 'Manhwa', 'Manhua', 'Webtoon'] as const;

export const SORT_OPTIONS = [
  { value: 'latest', label: 'Latest' },
  { value: 'popular', label: 'Popular' },
  { value: 'rating', label: 'Top Rated' },
  { value: 'az', label: 'A–Z' },
] as const;

export const PAGE_SIZE = 24;

/** Used until /genres answers (or if it fails). */
export const FALLBACK_GENRES = [
  'Action', 'Adult', 'Adventure', 'Comedy', 'Drama', 'Fantasy', 'Harem', 'Horror', 'Mature',
  'Mystery', 'Romance', 'Sci-Fi', 'Slice of Life', 'Sports', 'Supernatural',
];
