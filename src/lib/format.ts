const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/**
 * The API forwards `updated_at` either as an ISO date (JSON source) or as the source site's own
 * relative text ("39min ago") when it had to scrape HTML. Handle both.
 */
export function timeAgo(value?: string | null): string {
  if (!value) return '';
  const text = String(value).trim();
  if (/ago$/i.test(text)) return text; // already relative
  const ts = Date.parse(text);
  if (Number.isNaN(ts)) return text;
  const diff = Date.now() - ts;
  if (diff < 0 || diff < MINUTE) return 'just now';
  if (diff < HOUR) return `${Math.floor(diff / MINUTE)}min ago`;
  if (diff < DAY) return `${Math.floor(diff / HOUR)}h ago`;
  if (diff < 30 * DAY) return `${Math.floor(diff / DAY)}d ago`;
  if (diff < 365 * DAY) return `${Math.floor(diff / (30 * DAY))}mo ago`;
  return `${Math.floor(diff / (365 * DAY))}y ago`;
}

export function formatDate(value?: string | null): string {
  if (!value) return '';
  const ts = Date.parse(value);
  if (Number.isNaN(ts)) return value;
  return new Date(ts).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

export function formatMonthYear(value?: string | null): string {
  const ts = value ? Date.parse(value) : NaN;
  return Number.isNaN(ts) ? '' : new Date(ts).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
}

/** "Chapter 36", "Ch. 36", "36" → "Ch. 36". Empty when unknown. */
export function chapterLabel(value?: string | number | null): string {
  if (value === null || value === undefined || value === '') return '';
  const text = String(value).replace(/^(chapter|ch\.?)\s*/i, '').trim();
  return text ? `Ch. ${text}` : '';
}

/** Chapter number → URL segment (176 → "176", 70.5 → "70.5"). */
export const chapterSegment = (n: number | string) => String(n);

/** Extracts a chapter number from "176", "/title/x/chapter/176", "https://…/chapter/70.5", "Chapter 12". */
export function parseChapterRef(value?: string | null): string | null {
  if (!value) return null;
  const match = String(value).match(/(\d+(?:\.\d+)?)\s*\/?$/) ?? String(value).match(/chapter[^\d]*(\d+(?:\.\d+)?)/i);
  return match ? match[1] : null;
}

export function compactNumber(n?: number | null): string {
  if (n === null || n === undefined) return '—';
  return new Intl.NumberFormat(undefined, { notation: 'compact', maximumFractionDigits: 1 }).format(n);
}

export const pageNumbers = (current: number, total: number): (number | '…')[] => {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages = new Set([1, total, current, current - 1, current + 1]);
  if (current <= 3) [2, 3, 4].forEach((p) => pages.add(p));
  if (current >= total - 2) [total - 1, total - 2, total - 3].forEach((p) => pages.add(p));
  const sorted = [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
  const out: (number | '…')[] = [];
  sorted.forEach((p, i) => {
    if (i && p - sorted[i - 1] > 1) out.push('…');
    out.push(p);
  });
  return out;
};
