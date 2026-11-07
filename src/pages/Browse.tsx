import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ChevronDown, Search } from 'lucide-react';
import MangaCard from '../components/MangaCard';
import Pagination from '../components/Pagination';
import { CardGridSkeleton, EmptyState, ErrorState } from '../components/States';
import { FALLBACK_GENRES, MANGA_TYPES, PAGE_SIZE, SORT_OPTIONS } from '../config';
import { useAsync } from '../hooks/useAsync';
import { useDismiss } from '../hooks/useOnClickOutside';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { browse, getGenres } from '../lib/api';

const num = (v: string | null) => (v && !Number.isNaN(Number(v)) ? Number(v) : null);

export default function Browse() {
  const [params, setParams] = useSearchParams();

  // The URL is the single source of truth for what is being shown.
  const q = params.get('q') ?? params.get('search') ?? '';
  const genre = params.get('genre') ?? '';
  const type = params.get('type') ?? '';
  const sort = params.get('sort') ?? 'latest';
  const page = Math.max(1, Number(params.get('page')) || 1);
  const minChapters = num(params.get('minch'));
  const minScore = num(params.get('minscore'));

  // Draft values for the filter form; applied on submit (like the original site's "Apply" button).
  const [draft, setDraft] = useState({ q, genre, type, minch: String(minChapters ?? ''), minscore: String(minScore ?? '') });
  useEffect(() => {
    setDraft({ q, genre, type, minch: minChapters === null ? '' : String(minChapters), minscore: minScore === null ? '' : String(minScore) });
  }, [q, genre, type, minChapters, minScore]);

  const result = useAsync(() => browse({ page, sort, search: q, genre, type }), [page, sort, q, genre, type], true);
  const genres = useAsync(getGenres, []);

  const sortLabel = SORT_OPTIONS.find((s) => s.value === sort)?.label ?? 'Latest';
  const heading = q ? `Search results for “${q}”` : genre ? `${genre} Catalog` : type ? `${type} Catalog` : `${sortLabel} Catalog`;
  useDocumentTitle(heading);

  const update = (changes: Record<string, string | null>) => {
    const next = new URLSearchParams(params);
    next.delete('search');
    for (const [k, v] of Object.entries(changes)) {
      if (v) next.set(k, v); else next.delete(k);
    }
    if (!('page' in changes)) next.delete('page');
    setParams(next);
  };

  const apply = (e: FormEvent) => {
    e.preventDefault();
    update({ q: draft.q.trim(), genre: draft.genre, type: draft.type, minch: draft.minch, minscore: draft.minscore });
  };
  const reset = () => setParams(new URLSearchParams(sort !== 'latest' ? { sort } : {}));

  const genreOptions = useMemo(() => {
    const fromBrowse = result.data?.data.available_genres ?? [];
    const list = genres.data?.length ? genres.data : fromBrowse.length ? fromBrowse : FALLBACK_GENRES;
    return genre && !list.includes(genre) ? [genre, ...list] : list;
  }, [genres.data, result.data, genre]);

  // The API has no min-chapters / min-score parameters, so these two filters apply to the loaded page.
  const items = (result.data?.data.items ?? []).filter((m) => {
    if (minChapters !== null && (parseFloat(String(m.latest_chapter).replace(/[^\d.]/g, '')) || 0) < minChapters) return false;
    if (minScore !== null && (m.rating ?? 0) < minScore) return false;
    return true;
  });
  const clientFiltered = minChapters !== null || minScore !== null;

  const pagination = result.data?.pagination;
  const totalPages = pagination?.total_pages ?? (pagination?.has_next ? page + 1 : page);
  const total = pagination?.total;
  const from = (page - 1) * PAGE_SIZE + 1;
  const to = from + (result.data?.data.items.length ?? 0) - 1;

  const goToPage = (p: number) => { update({ page: p > 1 ? String(p) : null }); window.scrollTo({ top: 0, behavior: 'smooth' }); };

  return (
    <div className="container browse">
      <div className="browse-head">
        <h1>{heading}</h1>
        <SortControl value={sort} onChange={(v) => update({ sort: v === 'latest' ? null : v })} />
      </div>

      <form className="filter-bar" onSubmit={apply}>
        <label className="field grow">
          <span>Search manga</span>
          <div className="input-wrap"><Search size={16} /><input value={draft.q} onChange={(e) => setDraft({ ...draft, q: e.target.value })} placeholder="Type to search manga…" /></div>
        </label>
        <label className="field">
          <span>Genre</span>
          <select value={draft.genre} onChange={(e) => setDraft({ ...draft, genre: e.target.value })}>
            <option value="">All Genres</option>
            {genreOptions.map((g) => <option key={g}>{g}</option>)}
          </select>
        </label>
        <label className="field">
          <span>Type</span>
          <select value={draft.type} onChange={(e) => setDraft({ ...draft, type: e.target.value })}>
            <option value="">All Types</option>
            {MANGA_TYPES.map((t) => <option key={t}>{t}</option>)}
          </select>
        </label>
        <label className="field narrow">
          <span>Min chapters (≥)</span>
          <input type="number" min={0} inputMode="numeric" value={draft.minch} onChange={(e) => setDraft({ ...draft, minch: e.target.value })} />
        </label>
        <label className="field narrow">
          <span>Min score (1-10)</span>
          <input type="number" min={1} max={10} step={0.1} inputMode="decimal" placeholder="e.g. 8.5" value={draft.minscore} onChange={(e) => setDraft({ ...draft, minscore: e.target.value })} />
        </label>
        <div className="filter-actions">
          <button className="btn btn-accent" type="submit">Apply</button>
          <button className="btn btn-outline" type="button" onClick={reset}>Reset</button>
        </div>
      </form>

      {result.error && !result.data ? (
        <ErrorState error={result.error} onRetry={result.reload} />
      ) : (
        <>
          <p className="results-count">
            {result.loading && !result.data ? 'Loading…' : clientFiltered
              ? `${items.length} of ${result.data?.data.items.length ?? 0} titles on this page match your chapter/score filter`
              : total
                ? `Showing ${from} - ${to} of ${total.toLocaleString()} results`
                : `${items.length} results`}
          </p>
          <div className={result.loading && result.data ? 'is-refreshing' : ''}>
            {result.loading && !result.data ? (
              <CardGridSkeleton count={PAGE_SIZE} className="card-grid browse-grid" />
            ) : items.length ? (
              <div className="card-grid browse-grid">{items.map((m) => <MangaCard key={m.slug} manga={m} fallbackType={type || undefined} />)}</div>
            ) : (
              <EmptyState title="No results found">Try a different search term or clear some filters.</EmptyState>
            )}
          </div>
          <Pagination page={page} totalPages={totalPages} onChange={goToPage} />
        </>
      )}
    </div>
  );
}

function SortControl({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useDismiss(ref, open, () => setOpen(false));
  const primary = SORT_OPTIONS.slice(0, 2);
  const more = SORT_OPTIONS.slice(2);
  return (
    <div className="segmented" ref={ref}>
      {primary.map((o) => (
        <button key={o.value} className={value === o.value ? 'active' : ''} onClick={() => onChange(o.value)}>{o.label}</button>
      ))}
      <button className={`segmented-more ${more.some((o) => o.value === value) ? 'active' : ''}`} onClick={() => setOpen(!open)} aria-label="More sort options" aria-expanded={open}>
        {more.find((o) => o.value === value)?.label}<ChevronDown size={16} />
      </button>
      {open && (
        <div className="dropdown dropdown-list right">
          {more.map((o) => <button key={o.value} onClick={() => { onChange(o.value); setOpen(false); }}>{o.label}</button>)}
        </div>
      )}
    </div>
  );
}
