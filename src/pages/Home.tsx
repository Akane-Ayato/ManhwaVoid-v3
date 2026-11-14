import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, History, ListChecks, Loader2, TrendingUp } from 'lucide-react';
import Cover from '../components/Cover';
import MangaCard from '../components/MangaCard';
import SectionHeading from '../components/SectionHeading';
import { CardGridSkeleton, ErrorState } from '../components/States';
import { useAuth } from '../context/AuthContext';
import { useAsync } from '../hooks/useAsync';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { browse, getHistory, getHome } from '../lib/api';
import { chapterLabel, timeAgo } from '../lib/format';
import { imageUrl } from '../lib/images';
import { toApiError } from '../lib/http';
import type { MangaCard as Manga } from '../types/api';

export default function Home() {
  useDocumentTitle();
  const home = useAsync(() => getHome(), []);

  if (home.error) return <div className="container"><ErrorState error={home.error} onRetry={home.reload} /></div>;

  const data = home.data;
  const visible = new Set(data?.admin_settings?.visible_sections ?? ['hero', 'trending', 'latest_updates', 'popular', 'recommended']);
  const titles = data?.admin_settings?.section_titles ?? {};
  const order = data?.admin_settings?.section_order ?? ['hero', 'trending', 'latest_updates', 'popular', 'recommended'];
  const trending = data?.trending.length ? data.trending : (visible.has('hero') ? [] : data?.hero ?? []);
  const popular = data?.popular.length ? data.popular : trending;

  const renderSection = (key: string) => {
    if (!visible.has(key)) return null;
    if (key === 'hero') return data?.hero?.length ? <section key={key}><SectionHeading icon={<TrendingUp size={28} />} title={titles.hero || 'Featured'} tone="cool" /><TrendingRow items={data.hero} /></section> : null;
    if (key === 'trending') return <section key={key}><SectionHeading icon={<TrendingUp size={28} />} title={titles.trending || 'Trending Now'} tone="hot" to="/browse?sort=popular" />{home.loading ? <CardGridSkeleton count={6} className="trending-row" /> : <TrendingRow items={trending} />}</section>;
    if (key === 'latest_updates') return <section key={key}><SectionHeading icon={<ListChecks size={28} />} title={titles.latest_updates || 'Latest Updates'} tone="warm" to="/browse?sort=latest" />{home.loading ? <CardGridSkeleton count={10} /> : <LatestGrid initial={data?.latest_updates ?? []} />}</section>;
    if (key === 'recommended') return data?.recommended.length ? <section key={key}><SectionHeading icon={<ListChecks size={28} />} title={titles.recommended || 'Recommended'} tone="cool" /><div className="card-grid">{data.recommended.slice(0, 10).map((m) => <MangaCard key={m.slug} manga={m} />)}</div></section> : null;
    return null;
  };

  return (
    <div className="container home">
      <div className="home-grid">
        <div className="home-main">
          <ContinueReading />
          {order.filter((key) => key !== 'popular').map((key) => renderSection(key))}
        </div>

        {visible.has('popular') && <aside className="home-side">
          <h2 className="side-title">{titles.popular || 'Popular Ongoing'}</h2>
          {home.loading
            ? Array.from({ length: 8 }, (_, i) => <div key={i} className="skeleton side-skeleton" />)
            : <ol className="popular-list">{popular.slice(0, 10).map((m, i) => <PopularRow key={m.slug} manga={m} rank={i + 1} />)}</ol>}
        </aside>}
      </div>
    </div>
  );
}

/* ----------------------------------------------------------------- sections */

function ContinueReading() {
  const { user } = useAuth();
  const history = useAsync(
    () => (user ? getHistory(1, 12).then((r) => r.data.items) : Promise.resolve([])),
    [user?.id],
  );
  if (!user || !history.data?.length) return null;

  return (
    <section>
      <SectionHeading
        icon={<History size={26} />}
        title="Continue Reading"
        tone="cool"
        action={<Link to="/profile?tab=history" className="view-all">History</Link>}
      />
      <div className="continue-row">
        {history.data.map((h) => (
          <Link key={h.id} to={`/title/${h.manga_slug}/chapter/${h.chapter_number}`} className="continue-card">
            <Cover src={imageUrl(h.cover)} alt={h.manga_title} />
            <div>
              <b>{h.manga_title}</b>
              <span>{chapterLabel(h.chapter_number)} · {timeAgo(h.read_at)}</span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

function TrendingRow({ items }: { items: Manga[] }) {
  const row = useRef<HTMLDivElement>(null);
  const scroll = (dir: 1 | -1) => row.current?.scrollBy({ left: dir * row.current.clientWidth * 0.85, behavior: 'smooth' });
  if (!items.length) return <p className="muted">Nothing is trending right now.</p>;
  return (
    <div className="trending-wrap">
      <button className="carousel-btn left" onClick={() => scroll(-1)} aria-label="Scroll left"><ChevronLeft size={22} /></button>
      <div className="trending-row" ref={row}>
        {items.slice(0, 15).map((m, i) => <MangaCard key={m.slug} manga={m} rank={i + 1} />)}
      </div>
      <button className="carousel-btn right" onClick={() => scroll(1)} aria-label="Scroll right"><ChevronRight size={22} /></button>
    </div>
  );
}

function LatestGrid({ initial }: { initial: Manga[] }) {
  const [extra, setExtra] = useState<Manga[]>([]);
  const [page, setPage] = useState(2); // home already shows (roughly) page 1 of "latest"
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const items = [...initial, ...extra.filter((e) => !initial.some((i) => i.slug === e.slug))];

  const loadMore = async () => {
    setBusy(true);
    setError('');
    try {
      const res = await browse({ sort: 'latest', page });
      const seen = new Set([...initial, ...extra].map((m) => m.slug));
      const fresh = res.data.items.filter((m) => !seen.has(m.slug));
      setExtra((prev) => [...prev, ...fresh]);
      setPage((p) => p + 1);
      if (!res.data.items.length || res.pagination?.has_next === false) setDone(true);
    } catch (err) {
      setError(toApiError(err).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div className="card-grid">{items.map((m) => <MangaCard key={m.slug} manga={m} />)}</div>
      <div className="load-more">
        {error && <p className="form-error">{error}</p>}
        {!done && (
          <button className="btn btn-secondary btn-lg" onClick={loadMore} disabled={busy}>
            {busy ? <><Loader2 size={17} className="spin" /> Loading…</> : 'Load More'}
          </button>
        )}
      </div>
    </>
  );
}

function PopularRow({ manga, rank }: { manga: Manga; rank: number }) {
  return (
    <li>
      <Link to={`/title/${manga.slug}`} className="popular-item">
        <span className="popular-thumb">
          <Cover src={imageUrl(manga.cover)} alt={manga.title} />
          <span className={`rank rank-${Math.min(rank, 4)}`}>{rank}</span>
        </span>
        <span className="popular-text">
          <b>{manga.title}</b>
          <small>{chapterLabel(manga.latest_chapter)}</small>
        </span>
      </Link>
    </li>
  );
}
