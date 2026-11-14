import { PAGE_SIZE } from '../config';
import { cached, invalidate } from './cache';
import { getData, getPaged, sendData, tokens } from './http';
import type {
  AccountSummary, ActivityItem, AvatarPreset, BookmarkItem, BrowseData, Chapter, HistoryItem, HomeData,
  MangaCard, MangaDetails, NotificationPreferences, Pagination, ReaderData, TokenPair, User,
} from '../types/api';

const MIN = 60_000;

export interface BrowseParams {
  page?: number;
  per_page?: number;
  sort?: string;
  search?: string;
  genre?: string;
  type?: string;
  status?: string;
}

const clean = <T extends object>(params: T) =>
  Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '')) as Partial<T>;

/* ------------------------------------------------------------------ Discovery */


export interface PublicSiteConfig {
  maintenance_mode: boolean;
  registration_enabled: boolean;
  announcement_enabled: boolean;
  announcement_title: string;
  announcement_body: string;
  announcement_link: string;
}
export const getSiteConfig = () => getData<PublicSiteConfig>('/site-config');

export const getHome = (refresh = false) =>
  refresh ? getData<HomeData>('/home', { refresh: true }) : cached('home', 2 * MIN, () => getData<HomeData>('/home'));

/** No AbortSignal on purpose: results are cached/shared, so callers ignore stale responses instead. */
export async function browse(params: BrowseParams) {
  const query = clean({ per_page: PAGE_SIZE, page: 1, ...params });
  return cached(`browse:${JSON.stringify(query)}`, MIN, () => getPaged<BrowseData>('/browse', query));
}

export const searchManga = (q: string, perPage = 6, signal?: AbortSignal) =>
  getPaged<BrowseData>('/search', { q, per_page: perPage }, signal);

export const getGenres = () =>
  cached('genres', 30 * MIN, async () => (await getData<{ items: string[] }>('/genres')).items);

/** Picks a random title: one request for the total, one for the page holding a random item. */
export async function randomManga(): Promise<MangaCard | null> {
  const first = await getPaged<BrowseData>('/browse', { per_page: 1, page: 1 });
  const total = first.pagination?.total ?? 0;
  if (!total) return first.data.items[0] ?? null;
  const pick = Math.floor(Math.random() * total) + 1;
  const res = await getPaged<BrowseData>('/browse', { per_page: 1, page: pick });
  return res.data.items[0] ?? null;
}

/* --------------------------------------------------------------------- Manga */

export const getManga = (slug: string) =>
  cached(`manga:${slug}`, 5 * MIN, () => getData<MangaDetails>(`/manga/${encodeURIComponent(slug)}`));

export const getChapters = (slug: string) =>
  cached(`chapters:${slug}`, 5 * MIN, () =>
    getData<{ items: Chapter[]; total: number }>(`/manga/${encodeURIComponent(slug)}/chapters`, { per_page: 200 }).then((r) => r.items),
  );

export const getRecommendations = (slug: string) =>
  cached(`recs:${slug}`, 10 * MIN, () =>
    getData<{ items: MangaCard[] }>(`/manga/${encodeURIComponent(slug)}/recommendations`).then((r) => r.items),
  );

/**
 * For signed-in users this request also records reading history and it is the most strictly
 * rate-limited route (30/min), so it is only de-duplicated for a few seconds (React StrictMode,
 * double renders) and is never prefetched.
 */
export const getReader = (slug: string, chapter: string) =>
  cached(`reader:${slug}:${chapter}`, 4000, () =>
    getData<ReaderData>(`/manga/${encodeURIComponent(slug)}/chapters/${encodeURIComponent(chapter)}`),
  );

/* ---------------------------------------------------------------------- Auth */

export const login = (email_or_username: string, password: string) =>
  sendData<TokenPair>('post', '/auth/login', { email_or_username, password });

export const register = (body: { email: string; username: string; display_name: string; password: string }) =>
  sendData<TokenPair>('post', '/auth/register', body);

export async function logout() {
  const refresh_token = tokens.refresh();
  if (refresh_token) await sendData('post', '/auth/logout', { refresh_token }).catch(() => undefined);
}

/* --------------------------------------------------------------------- Users */

export const getMe = () => getData<User>('/users/me');
export const getPublicProfile = (username: string) => getData<User>(`/users/${encodeURIComponent(username)}`);
export const getSummary = () => getData<AccountSummary>('/users/me/summary');
export const getAvatarPresets = () => cached('avatars', 60 * MIN, async () => (await getData<{ items: AvatarPreset[] }>('/users/avatars')).items);

export const updateProfile = (body: { display_name?: string; bio?: string | null; is_public?: boolean }) =>
  sendData<User>('patch', '/users/me', body);
export const changeUsername = (new_username: string, current_password: string) =>
  sendData<{ username: string }>('post', '/users/me/username', { new_username, current_password });
export const changeEmail = (new_email: string, current_password: string) =>
  sendData<{ email: string }>('post', '/users/me/email', { new_email, current_password });
export const changePassword = (current_password: string, new_password: string) =>
  sendData<{ password_changed: boolean }>('post', '/users/me/password', { current_password, new_password });

export const setAvatarPreset = (avatar_id: string) => sendData('put', '/users/me/avatar/preset', { avatar_id });
export const setAvatarUrl = (url: string) => sendData('put', '/users/me/avatar/url', { url });
export const uploadAvatar = (file: File) => {
  const form = new FormData();
  form.append('file', file);
  return sendData('post', '/users/me/avatar/upload', form);
};

export const getPreferences = () => getData<{ notifications: NotificationPreferences }>('/users/me/preferences').then((r) => r.notifications);
export const updatePreferences = (prefs: NotificationPreferences) =>
  sendData<{ notifications: NotificationPreferences }>('patch', '/users/me/preferences', prefs).then((r) => r.notifications);

export const getActivity = (limit = 10) => getData<{ items: ActivityItem[] }>('/users/me/activity', { limit }).then((r) => r.items);
export const exportAccount = () => getData<Record<string, unknown>>('/users/me/export');

/* ----------------------------------------------------------------- Library */

export const getBookmarks = (page = 1, per_page = 24) => getPaged<{ items: BookmarkItem[]; total: number }>('/users/me/bookmarks', { page, per_page });
export const addBookmark = (body: { manga_slug: string; manga_title: string; cover?: string | null; manga_type?: string | null }) =>
  sendData('post', '/users/me/bookmarks', body);
export const removeBookmark = (slug: string) => sendData('delete', `/users/me/bookmarks/${encodeURIComponent(slug)}`);

export const getHistory = (page = 1, per_page = 30) => getPaged<{ items: HistoryItem[]; total: number }>('/users/me/history', { page, per_page });
export const clearHistory = () => sendData<{ deleted: number }>('delete', '/users/me/history');
export const recordHistory = (body: { manga_slug: string; manga_title: string; chapter_number: string; chapter_title?: string | null; cover?: string | null; progress?: number }) =>
  sendData('post', '/users/me/history', body);

export { invalidate };
export type { Pagination };
