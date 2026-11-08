import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowUp, ChevronLeft, ChevronRight, Home, ImageOff, Link2, List, Maximize, Minimize, Minus, Plus, RotateCw, X } from 'lucide-react';
import { ErrorState, Spinner } from '../components/States';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useAsync } from '../hooks/useAsync';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { getManga, getReader, recordHistory } from '../lib/api';
import { chapterLabel, chapterSegment, parseChapterRef } from '../lib/format';
import { imageUrl, recallCover } from '../lib/images';
import { markChapterRead, saveProgress, setLastChapter } from '../lib/readState';
import { storage } from '../lib/storage';
import type { ReaderData } from '../types/api';

const MIN_WIDTH = 480;
const MAX_WIDTH = 1200;
const WIDTH_STEP = 100;

export default function Reader() {
  const { loading } = useAuth();
  // Wait for the session check so the (history-recording) request is sent once, already authenticated.
  if (loading) return <Spinner />;
  return <ReaderView />;
}

function ReaderView() {
  const { slug = '', chapter = '' } = useParams();
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const reader = useAsync(() => getReader(slug, chapter), [slug, chapter]);
  const series = useAsync(() => getManga(slug).catch(() => null), [slug]);

  const [width, setWidth] = useState(() => Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, Number(storage.get('mhq_reader_width')) || 900)));
  const [pillVisible, setPillVisible] = useState(true);
  const [progress, setProgress] = useState(0);
  const [showTop, setShowTop] = useState(false);
  const [listOpen, setListOpen] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);

  const data = reader.data;
  const manga = series.data;
  const title = data?.manga_title || manga?.title.primary || slug;
  useDocumentTitle(data ? `${title} Chapter ${chapter}` : 'Reading');

  /* ---- chapter navigation: prefer the full chapter list, fall back to the reader's own links ---- */
  const numbers = useMemo(
    () => [...new Set((manga?.chapters ?? []).map((c) => c.chapter_number).filter((n): n is number => typeof n === 'number'))].sort((a, b) => a - b),
    [manga],
  );
  const current = Number(chapter);
  const index = numbers.indexOf(current);
  const prev = index >= 0 ? numbers[index - 1] : parseChapterRef(data?.navigation.previous);
  const next = index >= 0 ? numbers[index + 1] : parseChapterRef(data?.navigation.next);
  const latest = numbers.length ? numbers[numbers.length - 1] : null;
  const chapterUrl = (n: number | string) => `/title/${slug}/chapter/${chapterSegment(n)}`;
  const prevUrl = prev !== undefined && prev !== null ? chapterUrl(prev) : null;
  const nextUrl = next !== undefined && next !== null ? chapterUrl(next) : null;

  /* ---- local read state, and server history (cover is not part of the reader response) ---- */
  useEffect(() => {
    if (!data) return;
    markChapterRead(slug, chapter);
    setLastChapter(slug, chapter);
  }, [data, slug, chapter]);

  const historySent = useRef('');
  useEffect(() => {
    if (!user || !data || series.loading) return;
    const key = `${slug}:${chapter}:${user.id}`;
    if (historySent.current === key) return;
    const cover = recallCover(slug) || imageUrl(manga?.images.cover ?? manga?.images.card);
    if (!cover) return; // the API already recorded the read; only the cover would be missing
    historySent.current = key;
    recordHistory({
      manga_slug: slug,
      manga_title: title,
      chapter_number: chapter,
      chapter_title: data.chapter_title,
      cover,
    }).catch(() => undefined);
  }, [user, data, series.loading, slug, chapter, manga, title]);

  /* ---- scroll: progress bar, back-to-top, auto-hiding header pill ---- */
  useEffect(() => {
    window.scrollTo(0, 0);
    setProgress(0);
    let lastY = 0;
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const y = window.scrollY;
        const max = document.documentElement.scrollHeight - window.innerHeight;
        const pct = max > 0 ? Math.min(100, (y / max) * 100) : 0;
        setProgress(pct);
        setShowTop(y > 800);
        setPillVisible(y < 120 || y < lastY);
        lastY = y;
        saveProgress(slug, chapter, pct);
        ticking = false;
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [slug, chapter]);

  /* ---- keyboard: ← / → change chapter ---- */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === 'ArrowLeft' && prevUrl) navigate(prevUrl);
      if (e.key === 'ArrowRight' && nextUrl) navigate(nextUrl);
      if (e.key === 'Escape') setListOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [prevUrl, nextUrl, navigate]);

  useEffect(() => {
    const onChange = () => setFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  const resize = (delta: number) => {
    const w = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, width + delta));
    setWidth(w);
    storage.set('mhq_reader_width', String(w));
  };
  const toggleFullscreen = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
    } catch { /* not supported / denied */ }
  };
  const copyLink = async () => {
    try { await navigator.clipboard.writeText(window.location.href); toast.success('Link copied'); } catch { toast.error('Could not copy the link'); }
  };

  if (reader.loading) return <Spinner label="Loading chapter…" />;
  if (reader.error || !data) {
    return (
      <div className="container reader-error">
        <ErrorState error={reader.error ?? 'Chapter not found.'} onRetry={reader.reload} />
        <Link to={`/title/${slug}`} className="btn btn-secondary">Back to series</Link>
      </div>
    );
  }

  return (
    <div className="reader" style={{ ['--reader-width' as string]: `${width}px` }}>
      <div className="reader-progress"><span style={{ width: `${progress}%` }} /></div>

      <div className={`reader-pill ${pillVisible ? '' : 'hidden'}`}>
        {prevUrl ? <Link to={prevUrl} aria-label="Previous chapter"><ChevronLeft size={20} /></Link> : <span className="off"><ChevronLeft size={20} /></span>}
        <button onClick={() => setListOpen(true)} title="Chapter list">
          Ch. {data.chapter_number ?? chapter}{latest ? ` / ${latest}` : ''}
        </button>
        {nextUrl ? <Link to={nextUrl} aria-label="Next chapter"><ChevronRight size={20} /></Link> : <span className="off"><ChevronRight size={20} /></span>}
      </div>

      <div className="reader-rail" role="toolbar" aria-label="Reader tools">
        <Link to="/" title="Home"><Home size={19} /></Link>
        <Link to={`/title/${slug}`} title={`About ${title}`}><SeriesIcon /></Link>
        <button onClick={() => setListOpen(true)} title="Chapter list"><List size={19} /></button>
        <hr />
        <button onClick={() => resize(WIDTH_STEP)} disabled={width >= MAX_WIDTH} title="Wider"><Plus size={19} /></button>
        <button onClick={() => resize(-WIDTH_STEP)} disabled={width <= MIN_WIDTH} title="Narrower"><Minus size={19} /></button>
        <button onClick={toggleFullscreen} title="Fullscreen">{fullscreen ? <Minimize size={19} /> : <Maximize size={19} />}</button>
        <hr />
        <button onClick={copyLink} title="Copy link"><Link2 size={19} /></button>
      </div>

      <div className="reader-pages">
        {data.pages.map((p, i) => (
          <PageImage key={`${chapter}-${p.index}`} src={imageUrl(p.image)} number={p.page_number || i + 1} eager={i < 2} alt={`${title} chapter ${chapter} page ${p.page_number || i + 1}`} />
        ))}
      </div>

      <EndOfChapter data={data} title={title} slug={slug} chapter={chapter} prevUrl={prevUrl} nextUrl={nextUrl} />

      {showTop && <button className="to-top" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} aria-label="Back to top"><ArrowUp size={20} /></button>}
      {listOpen && <ChapterDrawer slug={slug} current={current} numbers={numbers} onClose={() => setListOpen(false)} />}
    </div>
  );
}

/* ------------------------------------------------------------------- pieces */

function SeriesIcon() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 7v14" /><path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z" />
    </svg>
  );
}

function PageImage({ src, alt, number, eager }: { src: string; alt: string; number: number; eager: boolean }) {
  const [state, setState] = useState<'loading' | 'ready' | 'failed'>('loading');
  const [attempt, setAttempt] = useState(0);
  const retry = useCallback(() => { setState('loading'); setAttempt((a) => a + 1); }, []);

  return (
    <div className={`page-frame ${state}`}>
      {state === 'failed' ? (
        <div className="page-failed">
          <ImageOff size={28} />
          <span>Page {number} failed to load</span>
          <button className="btn btn-secondary btn-sm" onClick={retry}><RotateCw size={14} /> Retry</button>
        </div>
      ) : (
        <img
          key={attempt}
          src={src}
          alt={alt}
          loading={eager ? 'eager' : 'lazy'}
          decoding="async"
          referrerPolicy="no-referrer"
          onLoad={() => setState('ready')}
          onError={() => setState('failed')}
        />
      )}
    </div>
  );
}

function EndOfChapter({ data, title, slug, chapter, prevUrl, nextUrl }: { data: ReaderData; title: string; slug: string; chapter: string; prevUrl: string | null; nextUrl: string | null }) {
  return (
    <footer className="reader-end">
      <p>{nextUrl ? `End of ${chapterLabel(chapter)}` : `You’re all caught up on ${title}`}</p>
      <div className="reader-end-nav">
        {prevUrl ? <Link to={prevUrl} className="btn btn-outline btn-lg"><ChevronLeft size={18} /> Previous Chapter</Link> : <span className="btn btn-outline btn-lg disabled"><ChevronLeft size={18} /> Previous Chapter</span>}
        {nextUrl ? <Link to={nextUrl} className="btn btn-blue btn-lg">Next Chapter <ChevronRight size={18} /></Link> : <Link to={`/title/${slug}`} className="btn btn-blue btn-lg">Back to series</Link>}
      </div>
      <nav className="breadcrumb" aria-label="Breadcrumb">
        <Link to="/">Home</Link><span>/</span><Link to={`/title/${slug}`}>{title}</Link><span>/</span><b>{data.chapter_title || `Chapter ${chapter}`}</b>
      </nav>
      <p className="hint">Tip: use the ← and → keys to switch chapters.</p>
    </footer>
  );
}

function ChapterDrawer({ slug, current, numbers, onClose }: { slug: string; current: number; numbers: number[]; onClose: () => void }) {
  const active = useRef<HTMLAnchorElement>(null);
  useEffect(() => { active.current?.scrollIntoView({ block: 'center' }); }, []);
  const desc = useMemo(() => [...numbers].reverse(), [numbers]);
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Chapter list">
        <div className="modal-head"><h3>Chapters</h3><button className="icon-btn" onClick={onClose} aria-label="Close"><X size={20} /></button></div>
        {desc.length === 0 ? <p className="muted pad">Chapter list unavailable.</p> : (
          <ul className="modal-list">
            {desc.map((n) => (
              <li key={n}>
                <Link ref={n === current ? active : undefined} to={`/title/${slug}/chapter/${chapterSegment(n)}`} onClick={onClose} className={n === current ? 'current' : ''}>
                  {chapterLabel(n)}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
