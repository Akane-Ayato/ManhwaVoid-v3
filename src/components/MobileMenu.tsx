import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate } from 'react-router-dom';
import { Bookmark, Download, History, LayoutGrid, LogOut, Moon, Plus, Minus, Settings, Shuffle, Sun, X, Home, Layers } from 'lucide-react';
import Avatar from './Avatar';
import SearchBox from './SearchBox';
import { MANGA_TYPES } from '../config';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useInstall } from '../lib/pwa';

interface Props {
  open: boolean;
  onClose: () => void;
  genres: string[];
  onRandom: () => void;
}

/**
 * Rendered through a portal into <body>. The header uses backdrop-filter, which turns it into the
 * containing block for `position: fixed` children - that is what clipped the old menu to the header's height.
 */
export default function MobileMenu({ open, onClose, genres, onRandom }: Props) {
  const { user, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();
  const install = useInstall();
  const [genresOpen, setGenresOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = ''; document.removeEventListener('keydown', onKey); };
  }, [open, onClose]);

  if (!open) return null;

  const handleInstall = async () => {
    onClose();
    await install.install();
  };

  return createPortal(
    <div className="mm-backdrop" onClick={onClose}>
      <aside className="mm" role="dialog" aria-modal="true" aria-label="Menu" onClick={(e) => e.stopPropagation()}>
        <div className="mm-head">
          <h2>Menu</h2>
          <button className="icon-btn" onClick={onClose} aria-label="Close menu"><X size={22} /></button>
        </div>

        <div className="mm-scroll">
          {user ? (
            <Link to="/profile?tab=summary" className="mm-user" onClick={onClose}>
              <Avatar user={user} size={46} />
              <span><b>{user.display_name}</b><small>View Profile &amp; Settings →</small></span>
            </Link>
          ) : (
            <div className="mm-guest">
              <Link to="/login" className="btn btn-primary" onClick={onClose}>Sign in</Link>
              <Link to="/register" className="btn btn-secondary" onClick={onClose}>Create account</Link>
            </div>
          )}

          <SearchBox onDone={onClose} />

          <nav className="mm-links">
            <Link to="/" onClick={onClose}><Home size={18} /> Home</Link>
            <button onClick={() => { onClose(); onRandom(); }}><Shuffle size={18} /> Random Manga</button>
          </nav>

          <h3 className="mm-label">Browse types</h3>
          <nav className="mm-sub">
            <Link to="/browse" onClick={onClose}>All Types</Link>
            {MANGA_TYPES.map((t) => <Link key={t} to={`/browse?type=${t}`} onClick={onClose}>{t}</Link>)}
          </nav>

          <button className="mm-label mm-toggle" onClick={() => setGenresOpen(!genresOpen)} aria-expanded={genresOpen}>
            Genres {genresOpen ? <Minus size={16} /> : <Plus size={16} />}
          </button>
          {genresOpen && (
            <div className="mm-genres">
              {genres.map((g) => <Link key={g} to={`/browse?genre=${encodeURIComponent(g)}`} onClick={onClose}>{g}</Link>)}
            </div>
          )}

          <h3 className="mm-label">Appearance</h3>
          <div className="mm-theme" role="group" aria-label="Theme">
            <button className={theme === 'dark' ? 'active' : ''} onClick={() => theme !== 'dark' && toggle()}><Moon size={15} /> Dark</button>
            <button className={theme === 'light' ? 'active' : ''} onClick={() => theme !== 'light' && toggle()}><Sun size={15} /> Light</button>
          </div>

          {install.available && (
            <button className="btn btn-outline btn-block mm-install" onClick={handleInstall}><Download size={16} /> Install app</button>
          )}

          {user && (
            <nav className="mm-links mm-account">
              <Link to="/profile?tab=summary" onClick={onClose}><LayoutGrid size={18} /> Account Summary</Link>
              <Link to="/profile?tab=bookmark" onClick={onClose}><Bookmark size={18} /> Bookmarks</Link>
              <Link to="/profile?tab=history" onClick={onClose}><History size={18} /> Reading History</Link>
              <Link to="/profile?tab=settings" onClick={onClose}><Settings size={18} /> Settings</Link>
              <button className="danger" onClick={async () => { await logout(); onClose(); navigate('/'); }}><LogOut size={18} /> Sign Out</button>
            </nav>
          )}
          <p className="mm-foot"><Layers size={13} /> Manhwa Void</p>
        </div>
      </aside>
    </div>,
    document.body,
  );
}
