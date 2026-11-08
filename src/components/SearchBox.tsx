import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Loader2, Search } from 'lucide-react';
import Cover from './Cover';
import { searchManga } from '../lib/api';
import { chapterLabel } from '../lib/format';
import { imageUrl } from '../lib/images';
import { useDebounce } from '../hooks/useDebounce';
import { useDismiss } from '../hooks/useOnClickOutside';
import type { MangaCard } from '../types/api';

export default function SearchBox({ autoFocus = false, onDone }: { autoFocus?: boolean; onDone?: () => void }) {
  const navigate = useNavigate();
  const [text, setText] = useState('');
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState<MangaCard[]>([]);
  const [busy, setBusy] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const debounced = useDebounce(text.trim(), 350);
  const latest = useRef(0);

  useDismiss(box, open, () => setOpen(false));

  // Live suggestions: min 2 chars, debounced, stale responses ignored.
  useEffect(() => {
    if (debounced.length < 2) { setResults([]); setBusy(false); return; }
    const id = ++latest.current;
    setBusy(true);
    searchManga(debounced, 6)
      .then((res) => { if (id === latest.current) setResults(res.data.items); })
      .catch(() => { if (id === latest.current) setResults([]); })
      .finally(() => { if (id === latest.current) setBusy(false); });
  }, [debounced]);

  const finish = () => { setOpen(false); setText(''); onDone?.(); };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const q = text.trim();
    if (!q) return;
    navigate(`/browse?q=${encodeURIComponent(q)}`);
    finish();
  };

  return (
    <div className="search-box" ref={box}>
      <form onSubmit={submit} role="search">
        <Search size={16} className="search-icon" />
        <input
          type="search"
          value={text}
          autoFocus={autoFocus}
          onChange={(e) => { setText(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder="Search manga, authors…"
          aria-label="Search manga"
        />
        {busy && <Loader2 size={15} className="spin search-busy" />}
      </form>
      {open && text.trim().length >= 2 && (
        <div className="search-dropdown">
          {results.map((m) => (
            <Link key={m.slug} to={`/title/${m.slug}`} onClick={finish} className="search-item">
              <Cover src={imageUrl(m.cover)} alt={m.title} />
              <span><b>{m.title}</b><small>{chapterLabel(m.latest_chapter)}{m.status ? ` · ${m.status}` : ''}</small></span>
            </Link>
          ))}
          {!busy && results.length === 0 && <div className="search-empty">No matches for “{text.trim()}”</div>}
          {results.length > 0 && (
            <Link to={`/browse?q=${encodeURIComponent(text.trim())}`} onClick={finish} className="search-all">See all results</Link>
          )}
        </div>
      )}
    </div>
  );
}
