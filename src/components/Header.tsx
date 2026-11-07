import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Bell, Bookmark, ChevronDown, Download, History, LayoutGrid, LogOut, Menu, Moon, Settings, Shuffle, Sun } from 'lucide-react';
import SearchBox from './SearchBox';
import Logo from './Logo';
import MobileMenu from './MobileMenu';
import Avatar from './Avatar';
import { FALLBACK_GENRES, MANGA_TYPES, SITE } from '../config';
import { useInstall } from '../lib/pwa';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import { getActivity, getGenres, randomManga } from '../lib/api';
import { timeAgo } from '../lib/format';
import { toApiError } from '../lib/http';
import { useDismiss } from '../hooks/useOnClickOutside';
import type { ActivityItem } from '../types/api';

type MenuName = 'browse' | 'genre' | 'activity' | 'user' | null;

export default function Header() {
  const { user, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [menu, setMenu] = useState<MenuName>(null);
  const [drawer, setDrawer] = useState(false);
  const [genres, setGenres] = useState<string[]>(FALLBACK_GENRES);
  const [activity, setActivity] = useState<ActivityItem[] | null>(null);
  const [rolling, setRolling] = useState(false);
  const install = useInstall();
  const nav = useRef<HTMLElement>(null);
  const closeMenu = useCallback(() => setMenu(null), []);

  useDismiss(nav, menu !== null, closeMenu);
  useEffect(() => { setMenu(null); setDrawer(false); }, [location.pathname, location.search]);
  useEffect(() => { getGenres().then((g) => g.length && setGenres(g)).catch(() => undefined); }, []);

  const open = (name: Exclude<MenuName, null>) => setMenu((m) => (m === name ? null : name));

  const openActivity = () => {
    open('activity');
    if (user) getActivity(8).then(setActivity).catch(() => setActivity([]));
  };

  const surprise = async () => {
    if (rolling) return;
    setRolling(true);
    try {
      const pick = await randomManga();
      if (pick) navigate(`/title/${pick.slug}`);
      else toast.info('No titles available right now.');
    } catch (err) {
      toast.error(toApiError(err).message);
    } finally {
      setRolling(false);
    }
  };

  const signOut = async () => {
    await logout();
    setMenu(null);
    navigate('/');
  };

  return (
    <header className="site-header" ref={nav}>
      <div className="container header-row">
        <Link to="/" className="brand" aria-label={`${SITE.name} home`}>
          <Logo />
        </Link>

        <nav className="primary-nav desktop-only" aria-label="Primary">
          <NavLink to="/" end>Home</NavLink>
          <div className="menu-wrap">
            <button className={`nav-btn ${menu === 'browse' ? 'open' : ''}`} onClick={() => open('browse')} aria-expanded={menu === 'browse'}>
              Browse <ChevronDown size={14} />
            </button>
            {menu === 'browse' && (
              <div className="dropdown dropdown-list">
                <Link to="/browse">All</Link>
                {MANGA_TYPES.map((t) => <Link key={t} to={`/browse?type=${t}`}>{t}</Link>)}
              </div>
            )}
          </div>
          <div className="menu-wrap">
            <button className={`nav-btn ${menu === 'genre' ? 'open' : ''}`} onClick={() => open('genre')} aria-expanded={menu === 'genre'}>
              Genre <ChevronDown size={14} />
            </button>
            {menu === 'genre' && (
              <div className="dropdown dropdown-genres">
                {genres.map((g) => <Link key={g} to={`/browse?genre=${encodeURIComponent(g)}`}>{g}</Link>)}
              </div>
            )}
          </div>
        </nav>

        <div className="header-search desktop-only"><SearchBox /></div>

        <div className="header-actions">
          <button className="icon-btn desktop-only" onClick={surprise} aria-label="Random title" title="Random title" disabled={rolling}>
            <Shuffle size={20} className={rolling ? 'spin' : ''} />
          </button>
          {install.available && (
            <button className="icon-btn desktop-only" onClick={install.install} aria-label="Install app" title="Install app"><Download size={20} /></button>
          )}
          <button className="icon-btn desktop-only" onClick={toggle} aria-label="Toggle theme" title="Toggle theme">
            {theme === 'dark' ? <Moon size={20} /> : <Sun size={20} />}
          </button>

          {user ? (
            <>
              <div className="menu-wrap">
                <button className="icon-btn" onClick={openActivity} aria-label="Recent activity" title="Recent activity"><Bell size={20} /></button>
                {menu === 'activity' && (
                  <div className="dropdown dropdown-activity">
                    <div className="dropdown-title">Recent activity</div>
                    {activity === null && <div className="dropdown-note">Loading…</div>}
                    {activity?.length === 0 && <div className="dropdown-note">Nothing yet — start reading!</div>}
                    {activity?.map((a) => (
                      <div key={a.id} className="activity-row"><span>{a.description}</span><small>{timeAgo(a.created_at)}</small></div>
                    ))}
                    <Link to="/profile?tab=notifications" className="dropdown-foot">Notification settings</Link>
                  </div>
                )}
              </div>
              <div className="menu-wrap">
                <button className="avatar-btn" onClick={() => open('user')} aria-label="Account menu" aria-expanded={menu === 'user'}>
                  <Avatar user={user} size={38} />
                </button>
                {menu === 'user' && (
                  <div className="dropdown dropdown-user">
                    <div className="user-head"><b>{user.display_name}</b><small>@{user.username}</small></div>
                    <Link to="/profile?tab=summary"><LayoutGrid size={16} /> Summary</Link>
                    <Link to="/profile?tab=bookmark"><Bookmark size={16} /> Bookmarks</Link>
                    <Link to="/profile?tab=history"><History size={16} /> History</Link>
                    <Link to="/profile?tab=settings"><Settings size={16} /> Settings</Link>
                    <button className="danger" onClick={signOut}><LogOut size={16} /> Log out</button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <Link to="/login" state={{ from: location.pathname + location.search }} className="btn btn-primary btn-sm">Sign in</Link>
          )}
          <button className="icon-btn mobile-only" aria-label="Open menu" onClick={() => setDrawer(true)}><Menu size={24} /></button>
        </div>
      </div>

      <MobileMenu open={drawer} onClose={() => setDrawer(false)} genres={genres} onRandom={surprise} />
    </header>
  );
}
