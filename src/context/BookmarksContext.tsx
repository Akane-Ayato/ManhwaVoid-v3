import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import * as api from '../lib/api';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';
import { toApiError } from '../lib/http';

interface BookmarkTarget { slug: string; title: string; cover?: string | null; type?: string | null }
interface BookmarksValue {
  isBookmarked: (slug: string) => boolean;
  toggle: (target: BookmarkTarget) => Promise<void>;
  count: number;
  /** Call after removing a bookmark elsewhere (e.g. profile page). */
  forget: (slug: string) => void;
}

const BookmarksCtx = createContext<BookmarksValue>(null as unknown as BookmarksValue);

/** Holds the set of bookmarked slugs for the signed-in user so any page can show/toggle the state. */
export function BookmarksProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const toast = useToast();
  const [slugs, setSlugs] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!user) { setSlugs(new Set()); return; }
    let cancelled = false;
    (async () => {
      const all = new Set<string>();
      for (let page = 1; page <= 20; page++) {
        const { data, pagination } = await api.getBookmarks(page, 100);
        data.items.forEach((b) => all.add(b.manga_slug));
        if (!pagination?.has_next) break;
      }
      if (!cancelled) setSlugs(all);
    })().catch(() => undefined);
    return () => { cancelled = true; };
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggle = useCallback(async (t: BookmarkTarget) => {
    if (!user) { toast.info('Sign in to bookmark titles.'); return; }
    const had = slugs.has(t.slug);
    const update = (add: boolean) => setSlugs((prev) => { const n = new Set(prev); if (add) n.add(t.slug); else n.delete(t.slug); return n; });
    update(!had); // optimistic
    try {
      if (had) await api.removeBookmark(t.slug);
      else await api.addBookmark({ manga_slug: t.slug, manga_title: t.title, cover: t.cover || null, manga_type: t.type || null });
      toast.success(had ? 'Removed from bookmarks' : 'Added to bookmarks');
    } catch (err) {
      update(had); // roll back
      toast.error(toApiError(err).message);
    }
  }, [user, slugs, toast]);

  const value = useMemo<BookmarksValue>(() => ({
    isBookmarked: (slug) => slugs.has(slug),
    toggle,
    count: slugs.size,
    forget: (slug) => setSlugs((prev) => { const n = new Set(prev); n.delete(slug); return n; }),
  }), [slugs, toggle]);

  return <BookmarksCtx.Provider value={value}>{children}</BookmarksCtx.Provider>;
}

export const useBookmarks = () => useContext(BookmarksCtx);
