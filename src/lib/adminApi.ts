import { getData, getPaged, sendData } from './http';

import type { AdminRole } from './adminAuthApi';
export type { AdminRole } from './adminAuthApi';
export interface AdminUser { id: string; username: string; display_name: string; email: string; role: AdminRole; is_active: boolean; joined_at: string; last_activity_at?: string | null }
export interface AdminManga { slug: string; title: string; cover?: { url?: string | null } | null; latest_chapter?: string | null; updated_at?: string | null; type?: string | null }
export interface MangaOverride { slug: string; title?: string | null; description?: string | null; status?: string | null; manga_type?: string | null; genres?: string[] | null; hidden: boolean }
export interface AdminChapter { title: string; chapter_number?: number | null; released_at?: string | null; hidden: boolean }
export interface HomepageSettings { visible_sections: string[]; section_titles: Record<string, string>; section_order: string[] }
export interface SiteSettings { maintenance_mode: boolean; registration_enabled: boolean; announcement_enabled: boolean; announcement_title: string; announcement_body: string; announcement_link: string }

export const getAdminDashboard = () => getData<Record<string, any>>('/_control/dashboard');
export const getAdminUsers = (params: { page?: number; per_page?: number; q?: string; role?: string; status?: string }) => getPaged<{ items: AdminUser[]; total: number }>('/_control/users', params);
export const updateAdminUserStatus = (id: string, is_active: boolean, reason?: string) => sendData('patch', `/_control/users/${encodeURIComponent(id)}/status`, { is_active, reason });
export const updateAdminUserRole = (id: string, role: AdminRole, reason?: string) => sendData('patch', `/_control/users/${encodeURIComponent(id)}/role`, { role, reason });
export const searchAdminManga = (q: string, page = 1) => getPaged<{ items: AdminManga[]; total: number; source: string }>('/_control/manga/search', { q, page, per_page: 24 });
export const getMangaOverride = (slug: string) => getData<MangaOverride>(`/_control/manga/${encodeURIComponent(slug)}/override`);
export const saveMangaOverride = (slug: string, data: Partial<MangaOverride>) => sendData('put', `/_control/manga/${encodeURIComponent(slug)}/override`, data);
export const getAdminChapters = (slug: string) => getData<{ items: AdminChapter[]; total: number }>(`/_control/manga/${encodeURIComponent(slug)}/chapters`);
export const setChapterVisibility = (slug: string, chapter: string, hidden: boolean) => sendData('patch', `/_control/manga/${encodeURIComponent(slug)}/chapters/${encodeURIComponent(chapter)}/visibility`, { hidden });
export const getHomepageSettings = () => getData<HomepageSettings>('/_control/homepage');
export const saveHomepageSettings = (data: HomepageSettings) => sendData('put', '/_control/homepage', data);
export const getSiteSettings = () => getData<SiteSettings>('/_control/settings');
export const saveSiteSettings = (data: SiteSettings) => sendData('put', '/_control/settings', data);
export const getSystemHealth = () => getData<Record<string, any>>('/_control/system/health');
export const getScraperStatus = () => getData<Record<string, any>>('/_control/scraper/status');
export const getCacheStatus = () => getData<Record<string, any>>('/_control/cache');
export const clearAdminCache = () => sendData('post', '/_control/cache/clear');
export const getAdminAudit = (page = 1) => getPaged<{ items: any[]; total: number }>('/_control/audit', { page, per_page: 30 });
