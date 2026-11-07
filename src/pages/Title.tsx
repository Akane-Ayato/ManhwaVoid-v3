import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowDownUp, Bookmark, BookOpen, BookmarkCheck, Brush, ChevronRight, Link2, MessageCircle, PenLine, Search, Sparkles, Star } from 'lucide-react';
import Cover from '../components/Cover';
import MangaCard from '../components/MangaCard';
import SectionHeading from '../components/SectionHeading';
import { EmptyState, ErrorState, Spinner } from '../components/States';
import { useBookmarks } from '../context/BookmarksContext';
import { useToast } from '../context/ToastContext';
import { useAsync } from '../hooks/useAsync';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { getChapters, getManga, getRecommendations } from '../lib/api';
import { chapterLabel, chapterSegment, compactNumber, formatDate } from '../lib/format';
import { imageUrl } from '../lib/images';
import { getLastChapter, getReadChapters } from '../lib/readState';
import type { Chapter, MangaCard as Manga, MangaDetails } from '../types/api';

const CHAPTERS_PER_RENDER = 100;

export default function Title() {
  const { slug = '' } = useParams();
  const detail = useAsync(() => getManga(slug), [slug]);
  useDocumentTitle(detail.data?.title.primary);

  if (detail.loading) return <Spinner label="Loading title…" />;
  if (detail.error || !detail.data) return <div className="container"><ErrorState error={detail.error ?? 'Title not found.'} onRetry={detail.reload} /></div>;
  return <TitleView manga={detail.data} />;
}

function TitleView({ manga }: { manga: MangaDetails }) {
  const { slug, title, metadata: meta, statistics: stats } = manga;
  const toast = useToast();
  const bookmarks = useBookmarks();

  // Chapters / recommendations normally come with the details; fall back to their own endpoints if not.
  const fallbackChapters = useAsync(() => (manga.chapters.length ? Promise.resolve([]) : getChapters(slug)), [slug]);
  const fallbackRecs = useAsync(() => (manga.recommendations.length ? Promise.resolve([]) : getRecommendations(slug)), [slug]);
  const chapters: Chapter[] = manga.chapters.length ? manga.chapters : fallbackChapters.data ?? [];
  const related: Manga[] = manga.recommendations.length ? manga.recommendations : fallbackRecs.data ?? [];

  const cover = imageUrl(manga.images.cover ?? manga.images.card);
  const backdrop = imageUrl(manga.images.banner) || cover;

  const readable = useMemo(
    () => chapters.filter((c) => c.chapter_number !== null && c.chapter_number !== undefined),
    [chapters],
  );
  const first = readable.reduce<Chapter | null>((a, c) => (!a || c.chapter_number! < a.chapter_number! ? c : a), null);
  const last = readable.reduce<Chapter | null>((a, c) => (!a || c.chapter_number! > a.chapter_number! ? c : a), null);
  const resume = getLastChapter(slug);

  const href = (n: number | string) => `/title/${slug}/chapter/${chapterSegment(n)}`;
  const saved = bookmarks.isBookmarked(slug);

  const copyLink = async () => {
    try { await navigator.clipboard.writeText(window.location.href); toast.success('Link copied'); }
    catch { toast.error('Could not copy the link'); }
  };
  const shareUrl = `https://wa.me/?text=${encodeURIComponent(`${title.primary} ${window.location.href}`)}`;

  return (
    <div className="title-page">
      <div className="title-backdrop" style={backdrop ? { backgroundImage: `url(${backdrop})` } : undefined} aria-hidden="true" />

      <div className="container">
        <div className="title-hero">
          <div className="title-cover"><Cover src={cover} alt={title.primary} eager /></div>

          <div className="title-info">
            <div className="panel">
              <h1>{title.primary}</h1>
              <ExpandableText className="alt-titles" lines={2} text={[title.native, ...title.alternative].filter(Boolean).join(' • ')} />
              <ExpandableText className="synopsis" lines={4} text={manga.description || 'No synopsis available yet.'} />
            </div>

            <div className="title-actions">
              <button
                className={`btn btn-violet btn-lg ${saved ? 'is-active' : ''}`}
                onClick={() => bookmarks.toggle({ slug, title: title.primary, cover, type: meta.type })}
                aria-pressed={saved}
              >
                {saved ? <BookmarkCheck size={18} /> : <Bookmark size={18} />} {saved ? 'Bookmarked' : 'Bookmark'}
              </button>
              {first ? <Link to={href(first.chapter_number!)} className="btn btn-light btn-lg"><BookOpen size={18} /> First Chapter</Link> : <span className="btn btn-light btn-lg disabled">First Chapter</span>}
              {resume
                ? <Link to={href(resume)} className="btn btn-amber btn-lg">Continue {chapterLabel(resume)}</Link>
                : last
                  ? <Link to={href(last.chapter_number!)} className="btn btn-amber btn-lg">Read Last Chapter</Link>
                  : <span className="btn btn-amber btn-lg disabled">Read Last Chapter</span>}
            </div>

            <div className="share-row">
              <button className="btn btn-whatsapp btn-sm" onClick={() => window.open(shareUrl, '_blank', 'noopener')}><MessageCircle size={16} /> Share</button>
              <button className="btn btn-secondary btn-sm" onClick={copyLink}><Link2 size={16} /> Copy link</button>
            </div>
          </div>
        </div>

        <div className="title-body">
          <aside className="title-side">
            <div className="panel stat-strip">
              <div><Star size={18} className="star" fill="currentColor" /><b>{meta.rating ?? '—'}</b><span>Rating</span></div>
              <div><BookOpen size={18} className="green" /><b>{stats.chapter_count ?? chapters.length}</b><span>Chapters</span></div>
              <div><Bookmark size={18} className="blue" /><b>{compactNumber(stats.follows)}</b><span>Bookmarks</span></div>
            </div>

            <div className="panel facts">
              <dl className="fact-row">
                <div><dt>Status</dt><dd><i className="dot" />{meta.status || 'Unknown'}</dd></div>
                <div><dt>Type</dt><dd><i className="dot" />{meta.type || '—'}</dd></div>
                <div><dt>Release</dt><dd><i className="dot" />{meta.release_year || '—'}</dd></div>
              </dl>
              {!!meta.authors.length && <PeopleRow icon={<PenLine size={16} />} label="Author" names={meta.authors} />}
              {!!meta.artists.length && <PeopleRow icon={<Brush size={16} />} label="Artist" names={meta.artists} />}
              {!!meta.genres.length && (
                <div className="chip-row">
                  {meta.genres.map((g) => <Link key={g} to={`/browse?genre=${encodeURIComponent(g)}`} className="chip">{g}</Link>)}
                </div>
              )}
            </div>
          </aside>

          <ChapterList slug={slug} chapters={chapters} loading={fallbackChapters.loading} />
        </div>

        {related.length > 0 && (
          <section className="related">
            <SectionHeading icon={<Sparkles size={26} />} title="Related" tone="cool" to="/browse" />
            <div className="card-grid">{related.slice(0, 12).map((m) => <MangaCard key={m.slug} manga={m} />)}</div>
          </section>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------- pieces */

function ExpandableText({ text, lines, className }: { text: string; lines: number; className: string }) {
  const [open, setOpen] = useState(false);
  if (!text) return null;
  const long = text.length > lines * 110;
  return (
    <div className={className}>
      <p style={!open ? { WebkitLineClamp: lines } : undefined} className={open ? '' : 'clamped'}>{text}</p>
      {long && <button className="link-btn" onClick={() => setOpen(!open)}>{open ? 'Show less' : 'Show more'}</button>}
    </div>
  );
}

function PeopleRow({ icon, label, names }: { icon: React.ReactNode; label: string; names: string[] }) {
  return (
    <div className="people-row">
      <span className="people-label">{icon}{label}</span>
      <span className="people-names">
        {names.map((n) => <Link key={n} to={`/browse?q=${encodeURIComponent(n)}`} className="chip chip-solid">{n}</Link>)}
      </span>
    </div>
  );
}

function ChapterList({ slug, chapters, loading }: { slug: string; chapters: Chapter[]; loading: boolean }) {
  const [query, setQuery] = useState('');
  const [newestFirst, setNewestFirst] = useState(true);
  const [limit, setLimit] = useState(CHAPTERS_PER_RENDER);
  const [read, setRead] = useState<Set<string>>(new Set());
  useEffect(() => { setRead(getReadChapters(slug)); }, [slug]);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = q ? chapters.filter((c) => `${c.title} ${c.chapter_number ?? ''}`.toLowerCase().includes(q)) : chapters;
    return [...filtered].sort((a, b) => ((a.chapter_number ?? -1) - (b.chapter_number ?? -1)) * (newestFirst ? -1 : 1));
  }, [chapters, query, newestFirst]);

  return (
    <section className="panel chapters">
      <div className="chapters-head">
        <h2>{chapters.length} Chapters</h2>
        <button className="btn btn-outline btn-sm" onClick={() => setNewestFirst(!newestFirst)}>
          <ArrowDownUp size={15} /> {newestFirst ? 'Newest' : 'Oldest'}
        </button>
      </div>
      <div className="input-wrap chapter-search">
        <Search size={16} />
        <input value={query} onChange={(e) => { setQuery(e.target.value); setLimit(CHAPTERS_PER_RENDER); }} placeholder="Search chapters…" aria-label="Search chapters" />
      </div>

      {loading ? <Spinner /> : rows.length === 0 ? <EmptyState title="No chapters found" /> : (
        <ul className="chapter-list">
          {rows.slice(0, limit).map((c) => {
            const n = c.chapter_number;
            const label = n !== null && n !== undefined ? chapterLabel(n) : c.title;
            const subtitle = c.title && c.title.replace(/\D/g, '') !== String(n ?? '').replace(/\D/g, '') ? c.title : '';
            const body = (
              <>
                <span className="chapter-name">{label}{subtitle && <small>{subtitle}</small>}</span>
                <span className="chapter-date">{formatDate(c.released_at)}</span>
                <ChevronRight size={18} />
              </>
            );
            return (
              <li key={c.id ?? c.slug ?? c.title}>
                {n !== null && n !== undefined
                  ? <Link to={`/title/${slug}/chapter/${chapterSegment(n)}`} className={read.has(chapterSegment(n)) ? 'chapter-row is-read' : 'chapter-row'}>{body}</Link>
                  : <span className="chapter-row disabled">{body}</span>}
              </li>
            );
          })}
        </ul>
      )}
      {rows.length > limit && (
        <button className="btn btn-secondary btn-block" onClick={() => setLimit((l) => l + CHAPTERS_PER_RENDER)}>
          Show more ({rows.length - limit} remaining)
        </button>
      )}
    </section>
  );
}
