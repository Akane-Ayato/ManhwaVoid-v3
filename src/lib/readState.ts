import { storage } from './storage';

/** Local-only record of opened chapters, used to highlight them in the chapter list. */
const key = (slug: string) => `mhq_read:${slug}`;
const MAX_PER_TITLE = 2000;

export function getReadChapters(slug: string): Set<string> {
  return new Set(storage.getJSON<string[]>(key(slug), []));
}

export function markChapterRead(slug: string, chapter: string) {
  const list = storage.getJSON<string[]>(key(slug), []);
  if (list.includes(chapter)) return;
  list.push(chapter);
  storage.setJSON(key(slug), list.slice(-MAX_PER_TITLE));
}

export function saveProgress(slug: string, chapter: string, percent: number) {
  storage.set(`mhq_progress:${slug}:${chapter}`, String(Math.round(percent)));
}
export function getProgress(slug: string, chapter: string): number {
  return Number(storage.get(`mhq_progress:${slug}:${chapter}`)) || 0;
}

export const setLastChapter = (slug: string, chapter: string) => storage.set(`mhq_last:${slug}`, chapter);
export const getLastChapter = (slug: string) => storage.get(`mhq_last:${slug}`);
