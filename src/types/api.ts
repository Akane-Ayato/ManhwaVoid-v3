/** Types mirror app/models/* and app/users/schemas.py in the API. */

export interface Pagination {
  page: number;
  per_page: number;
  total: number | null;
  total_pages: number | null;
  has_next: boolean | null;
  has_previous: boolean | null;
}

export interface Envelope<T> {
  success: boolean;
  data: T;
  pagination?: Pagination | null;
  error?: { code: string; message: string; details?: { errors?: ValidationIssue[] } & Record<string, unknown> } | null;
}

export interface ValidationIssue {
  loc?: (string | number)[];
  msg?: string;
}

export interface Paged<T> {
  data: T;
  pagination: Pagination | null;
}

export interface ImageAsset {
  url?: string | null;
  alt?: string | null;
}

/** Browse/search cards. `type` is only present on home & recommendation cards. */
export interface MangaCard {
  id?: string | null;
  slug: string;
  title: string;
  cover?: ImageAsset | null;
  latest_chapter?: string | null;
  updated_at?: string | null;
  type?: string | null;
  rating?: number | null;
  status?: string | null;
  href?: string | null;
}

export interface HomeSection {
  key: string;
  title: string;
  items: MangaCard[];
}

export interface HomeData {
  hero: MangaCard[];
  trending: MangaCard[];
  latest_updates: MangaCard[];
  popular: MangaCard[];
  recommended: MangaCard[];
  sections: HomeSection[];
  admin_settings?: { visible_sections?: string[]; section_titles?: Record<string, string>; section_order?: string[] };
}

export interface BrowseData {
  items: MangaCard[];
  available_genres: string[];
  applied_filters: Record<string, string>;
}

export interface Chapter {
  id?: string | null;
  slug?: string | null;
  title: string;
  chapter_number?: number | null;
  released_at?: string | null;
  href?: string | null;
}

export interface MangaDetails {
  id?: string | null;
  slug: string;
  url: string;
  title: { primary: string; alternative: string[]; native?: string | null };
  description?: string | null;
  images: { cover?: ImageAsset | null; banner?: ImageAsset | null; card?: ImageAsset | null } & Record<string, ImageAsset | null | undefined>;
  metadata: {
    type?: string | null;
    status?: string | null;
    release_year?: number | null;
    authors: string[];
    artists: string[];
    genres: string[];
    rating?: number | null;
    rating_count?: number | null;
  };
  statistics: { views?: number | null; follows?: number | null; chapter_count?: number | null };
  chapters: Chapter[];
  recommendations: MangaCard[];
}

export interface ReaderPage {
  index: number;
  page_number: number;
  image: ImageAsset;
}

export interface ReaderData {
  manga_slug: string;
  manga_title?: string | null;
  chapter_title: string;
  chapter_number?: number | null;
  chapter_url: string;
  pages: ReaderPage[];
  page_count: number;
  navigation: Record<string, string | null | undefined>;
  published_at?: string | null;
}

export interface Avatar {
  kind?: string;
  value?: string;
  url?: string;
}

export interface User {
  id: string;
  username: string;
  display_name: string;
  bio?: string | null;
  avatar: Avatar;
  joined_at: string;
  is_public: boolean;
  email?: string;
  last_activity_at?: string | null;
  last_read_at?: string | null;
}

export interface TokenPair {
  token_type: string;
  access_token: string;
  refresh_token: string;
  expires_in: number;
  user: User;
}

export interface AccountSummary {
  bookmarked: number;
  total_chapters_read: number;
  last_read_at?: string | null;
  last_activity_at?: string | null;
}

export interface BookmarkItem {
  id: string;
  manga_slug: string;
  manga_title: string;
  cover?: string | null;
  manga_type?: string | null;
  created_at: string;
}

export interface HistoryItem {
  id: string;
  manga_slug: string;
  manga_title: string;
  chapter_number: string;
  chapter_title?: string | null;
  cover?: string | null;
  read_at: string;
  progress?: number;
}

export interface ActivityItem {
  id: string;
  action: string;
  description: string;
  created_at: string;
}

export interface NotificationPreferences {
  email_updates: boolean;
  reading_reminders: boolean;
  product_announcements: boolean;
}

export interface AvatarPreset {
  id: string;
  url: string;
}
