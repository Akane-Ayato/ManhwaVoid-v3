import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  Activity, AlertTriangle, ArrowDown, ArrowUp, BookOpen, ChevronRight, Gauge,
  Database, FileClock, Globe, LayoutDashboard, LogOut, Menu, RefreshCw, Search, Settings,
  Shield, Users, X, Zap,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { toApiError } from '../lib/http';
import {
  clearAdminCache, getAdminAudit, getAdminDashboard, getAdminUsers, getCacheStatus,
  getHomepageSettings, getMangaOverride, getAdminChapters, getScraperStatus, getSiteSettings,
  getSystemHealth, saveHomepageSettings, saveMangaOverride, saveSiteSettings,
  searchAdminManga, setChapterVisibility, updateAdminUserRole, updateAdminUserStatus,
  type AdminRole, type AdminUser, type HomepageSettings, type MangaOverride,
  type SiteSettings, type AdminManga, type AdminChapter,
} from '../lib/adminApi';
import type { AdminMe } from '../lib/adminAuthApi';
import Logo from '../components/Logo';

const NAV = [
  { id: 'overview', label: 'Overview', group: 'WORKSPACE', icon: LayoutDashboard, permission: 'dashboard.read' },
  { id: 'manga', label: 'Manga catalogue', group: 'CONTENT', icon: BookOpen, permission: 'content.read' },
  { id: 'homepage', label: 'Homepage CMS', group: 'CONTENT', icon: Globe, permission: 'homepage.read' },
  { id: 'users', label: 'User management', group: 'PEOPLE', icon: Users, permission: 'users.read' },
  { id: 'system', label: 'System & scraper', group: 'OPERATIONS', icon: Activity, permission: 'system.read' },
  { id: 'settings', label: 'Site settings', group: 'CONFIGURATION', icon: Settings, permission: 'settings.read' },
  { id: 'audit', label: 'Audit history', group: 'SECURITY', icon: FileClock, permission: 'audit.read' },
];
const SECTION_KEYS = ['hero', 'trending', 'latest_updates', 'popular', 'recommended'];
const SECTION_LABELS: Record<string, string> = { hero: 'Featured', trending: 'Trending Now', latest_updates: 'Latest Updates', popular: 'Popular', recommended: 'Recommended' };
const fmt = (value: unknown) => typeof value === 'number' ? value.toLocaleString() : value == null ? '—' : String(value);
const date = (value?: string | null) => value ? new Date(value).toLocaleString() : 'Never';

export default function AdminPage({ admin }: { admin: AdminMe }) {
  useDocumentTitle('Control Center');
  const { logout } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [active, setActive] = useState('overview');
  const [mobileNav, setMobileNav] = useState(false);
  const [busy, setBusy] = useState(false);
  const [dashboard, setDashboard] = useState<Record<string, any> | null>(null);
  const visibleNav = useMemo(() => NAV.filter((item) => admin.permissions.includes('*') || admin.permissions.includes(item.permission)), [admin]);
  const selected = visibleNav.find((item) => item.id === active) ?? visibleNav[0];
  const run = useCallback(async (job: () => Promise<unknown>, success?: string) => {
    setBusy(true);
    try { const result = await job(); if (success) toast.success(success); return result; }
    catch (err) { toast.error(toApiError(err).message); return null; }
    finally { setBusy(false); }
  }, [toast]);

  const loadDashboard = useCallback(async () => {
    const result = await run(getAdminDashboard);
    if (result) setDashboard(result as Record<string, any>);
  }, [run]);
  useEffect(() => { void loadDashboard(); }, [loadDashboard]);

  const signOut = async () => { await logout(); navigate('/login', { replace: true }); };
  const groups = [...new Set(visibleNav.map((item) => item.group))];

  return (
    <div className="admin-shell">
      <aside className={`admin-sidebar ${mobileNav ? 'is-open' : ''}`}>
        <div className="admin-brand"><Logo size={34} /><div><b>MANHWAVOID</b><small>CONTROL CENTER</small></div><button className="admin-mobile-close" onClick={() => setMobileNav(false)} aria-label="Close menu"><X size={19} /></button></div>
        <div className="admin-nav">
          {groups.map((group) => <div className="admin-nav-group" key={group}><span>{group}</span>{visibleNav.filter((item) => item.group === group).map((item) => {
            const Icon = item.icon;
            return <button key={item.id} className={active === item.id ? 'active' : ''} onClick={() => { setActive(item.id); setMobileNav(false); }}><Icon size={17} />{item.label}<ChevronRight size={15} /></button>;
          })}</div>)}
        </div>
        <div className="admin-sidebar-foot"><div className="admin-user-chip"><span className="admin-user-avatar">{admin.display_name?.slice(0, 1).toUpperCase() || 'A'}</span><div><b>{admin.display_name}</b><small>{admin.role.replace('_', ' ')}</small></div></div><button onClick={signOut}><LogOut size={16} /> Sign out</button></div>
      </aside>
      {mobileNav && <button className="admin-backdrop" onClick={() => setMobileNav(false)} aria-label="Close navigation" />}
      <main className="admin-main">
        <header className="admin-topbar"><button className="admin-menu-toggle" onClick={() => setMobileNav(true)} aria-label="Open navigation"><Menu size={20} /></button><div><span>MANHWAVOID /</span> {selected?.label ?? 'Control Center'}</div><div className="admin-top-actions"><span className="admin-live-dot" /> Administrator session <button className="admin-refresh" onClick={loadDashboard} disabled={busy} title="Refresh overview"><RefreshCw size={16} className={busy ? 'spin' : ''} /></button></div></header>
        <div className="admin-content">
          {active === 'overview' && <Overview data={dashboard} refresh={loadDashboard} />}
          {active === 'manga' && <MangaManager run={run} />}
          {active === 'homepage' && <HomepageManager run={run} />}
          {active === 'users' && <UsersManager admin={admin} run={run} />}
          {active === 'system' && <SystemManager run={run} />}
          {active === 'settings' && <SettingsManager run={run} />}
          {active === 'audit' && <AuditManager run={run} />}
        </div>
      </main>
    </div>
  );
}

function PageHeading({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: ReactNode }) {
  return <div className="admin-page-heading"><div><span>{eyebrow}</span><h1>{title}</h1><p>{description}</p></div>{action}</div>;
}
function StatCard({ label, value, detail, icon: Icon }: { label: string; value: unknown; detail: string; icon: typeof Users }) {
  return <article className="admin-stat"><div className="admin-stat-top"><span>{label}</span><i><Icon size={18} /></i></div><strong>{fmt(value)}</strong><small>{detail}</small></article>;
}
function Overview({ data, refresh }: { data: Record<string, any> | null; refresh: () => void }) {
  return <>
    <PageHeading eyebrow="WORKSPACE / OVERVIEW" title="Good to see you." description="A live snapshot of your ManhwaVoid platform." action={<button className="admin-btn secondary" onClick={refresh}><RefreshCw size={15} /> Refresh data</button>} />
    {!data ? <div className="admin-panel admin-loading">Loading dashboard metrics…</div> : <>
      <div className="admin-stat-grid">
        <StatCard label="Total members" value={data.users_total} detail={`${fmt(data.users_active)} active accounts`} icon={Users} />
        <StatCard label="Active in 24 hours" value={data.users_active_24h} detail="Based on last activity timestamp" icon={Activity} />
        <StatCard label="Bookmarks saved" value={data.bookmarks_total} detail="Across all member accounts" icon={BookOpen} />
        <StatCard label="Reading positions" value={data.reading_positions} detail="Stored user reading records" icon={Gauge} />
      </div>
      <div className="admin-overview-grid">
        <section className="admin-panel"><div className="admin-panel-heading"><div><span>PLATFORM STATUS</span><h2>System overview</h2></div><span className="admin-status good">Operational</span></div><div className="admin-health-list"><HealthRow label="API process" value="Operational" good /><HealthRow label="MongoDB-backed rate limiter" value={data.rate_limiter} good={data.rate_limiter === 'available' || data.rate_limiter === 'disabled'} /><HealthRow label="Local cache entries" value={`${fmt(data.cache?.items)} / ${fmt(data.cache?.max_items)}`} good /><HealthRow label="Active refresh sessions" value={fmt(data.active_sessions)} good /></div></section>
        <section className="admin-panel"><div className="admin-panel-heading"><div><span>ADMINISTRATOR NOTE</span><h2>Operational visibility</h2></div><Shield size={19} /></div><p className="admin-muted">This dashboard reports values available from the current MongoDB collections and process-local cache. Request totals and latency percentiles are intentionally not shown until persistent request telemetry is configured.</p><div className="admin-note"><AlertTriangle size={17} /><span>Scraper availability is monitored separately. A healthy API does not guarantee that the upstream manga source is reachable.</span></div></section>
      </div>
    </>}
  </>;
}
function HealthRow({ label, value, good }: { label: string; value: string; good: boolean }) { return <div className="admin-health-row"><span><i className={good ? 'good' : 'warn'} />{label}</span><b>{value}</b></div>; }

function MangaManager({ run }: { run: (job: () => Promise<unknown>, success?: string) => Promise<unknown> }) {
  const [query, setQuery] = useState(''); const [items, setItems] = useState<AdminManga[]>([]); const [selected, setSelected] = useState<AdminManga | null>(null); const [override, setOverride] = useState<MangaOverride | null>(null); const [chapters, setChapters] = useState<AdminChapter[]>([]); const [busy, setBusy] = useState(false);
  const search = async () => { setBusy(true); const result = await run(() => searchAdminManga(query)) as any; if (result?.data?.items) setItems(result.data.items); setBusy(false); };
  const open = async (manga: AdminManga) => { setSelected(manga); setBusy(true); const [o, c] = await Promise.all([run(() => getMangaOverride(manga.slug)), run(() => getAdminChapters(manga.slug))]); if (o) setOverride(o as MangaOverride); if (c) setChapters((c as any).items ?? []); setBusy(false); };
  const save = async () => { if (!selected || !override) return; const result = await run(() => saveMangaOverride(selected.slug, { title: override.title, description: override.description, status: override.status, manga_type: override.manga_type, genres: override.genres, hidden: override.hidden }), 'Manga overrides saved.'); if (result) setSelected(null); };
  const toggleChapter = async (chapter: AdminChapter) => { if (!selected) return; const n = String(chapter.chapter_number ?? chapter.title.replace(/^Chapter\s*/i, '')); const result = await run(() => setChapterVisibility(selected.slug, n, !chapter.hidden), 'Chapter visibility updated.'); if (result) setChapters((old) => old.map((x) => x === chapter ? { ...x, hidden: !x.hidden } : x)); };
  return <>
    <PageHeading eyebrow="CONTENT / CATALOGUE" title="Manga management" description="Search the upstream catalogue and apply local editorial overrides without changing source-owned records." />
    <section className="admin-panel"><div className="admin-search-row"><div className="admin-search"><Search size={17} /><input value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && search()} placeholder="Search manga title or slug…" /></div><button className="admin-btn primary" onClick={search} disabled={busy}><Search size={15} /> Search catalogue</button></div>
      <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Title</th><th>Slug</th><th>Latest chapter</th><th>Type</th><th /></tr></thead><tbody>{items.map((item) => <tr key={item.slug}><td><b>{item.title}</b></td><td className="mono">{item.slug}</td><td>{item.latest_chapter || '—'}</td><td>{item.type || '—'}</td><td><button className="admin-btn tiny secondary" onClick={() => open(item)}>Manage <ChevronRight size={13} /></button></td></tr>)}{!items.length && <tr><td colSpan={5} className="admin-empty">Search the source catalogue to manage a title.</td></tr>}</tbody></table></div>
    </section>
    {selected && override && <section className="admin-panel admin-editor"><div className="admin-panel-heading"><div><span>LOCAL EDITORIAL OVERRIDE</span><h2>{selected.title}</h2><small className="admin-muted">{selected.slug}</small></div><button className="admin-icon-button" onClick={() => setSelected(null)} aria-label="Close editor"><X size={18} /></button></div>
      <div className="admin-form-grid"><label>Display title<input value={override.title ?? ''} onChange={(e) => setOverride({ ...override, title: e.target.value || null })} placeholder={selected.title} /></label><label>Status<input value={override.status ?? ''} onChange={(e) => setOverride({ ...override, status: e.target.value || null })} placeholder="Leave blank to use source value" /></label><label>Type<input value={override.manga_type ?? ''} onChange={(e) => setOverride({ ...override, manga_type: e.target.value || null })} placeholder={selected.type || 'Manhwa'} /></label><label>Genres (comma separated)<input value={(override.genres ?? []).join(', ')} onChange={(e) => setOverride({ ...override, genres: e.target.value.split(',').map((x) => x.trim()).filter(Boolean) })} /></label><label className="wide">Synopsis override<textarea value={override.description ?? ''} onChange={(e) => setOverride({ ...override, description: e.target.value || null })} placeholder="Leave blank to use source synopsis" /></label><label className="admin-check wide"><input type="checkbox" checked={Boolean(override.hidden)} onChange={(e) => setOverride({ ...override, hidden: e.target.checked })} /> Hide this manga from public API results</label></div>
      <div className="admin-actions"><button className="admin-btn primary" onClick={save}>Save overrides</button><button className="admin-btn secondary" onClick={() => setSelected(null)}>Close</button></div>
      <div className="admin-panel-heading chapters-heading"><div><span>CHAPTER VISIBILITY</span><h2>Source chapters</h2></div><small className="admin-muted">Chapter metadata remains source-owned.</small></div>
      <div className="admin-chapter-list">{chapters.map((chapter, i) => <div key={`${chapter.chapter_number ?? chapter.title}-${i}`}><span>{chapter.title}</span><button className={`admin-btn tiny ${chapter.hidden ? 'danger' : 'secondary'}`} onClick={() => toggleChapter(chapter)}>{chapter.hidden ? 'Hidden · Restore' : 'Visible · Hide'}</button></div>)}{!chapters.length && <p className="admin-empty">No chapters returned for this title.</p>}</div>
    </section>}
  </>;
}

function HomepageManager({ run }: { run: (job: () => Promise<unknown>, success?: string) => Promise<unknown> }) {
  const [form, setForm] = useState<HomepageSettings>({ visible_sections: SECTION_KEYS, section_titles: {}, section_order: SECTION_KEYS }); const [loaded, setLoaded] = useState(false);
  useEffect(() => { getHomepageSettings().then((v) => { setForm(v); setLoaded(true); }).catch(() => setLoaded(true)); }, []);
  const toggle = (key: string) => setForm((f) => ({ ...f, visible_sections: f.visible_sections.includes(key) ? f.visible_sections.filter((x) => x !== key) : [...f.visible_sections, key] }));
  const move = (key: string, dir: -1 | 1) => setForm((f) => { const list = [...f.section_order]; const i = list.indexOf(key); const j = i + dir; if (j < 0 || j >= list.length) return f; [list[i], list[j]] = [list[j], list[i]]; return { ...f, section_order: list }; });
  return <><PageHeading eyebrow="CONTENT / PRESENTATION" title="Homepage CMS" description="Choose which source-powered sections appear and customize their headings." />
    <section className="admin-panel"><div className="admin-panel-heading"><div><span>SECTION CONFIGURATION</span><h2>Homepage layout</h2></div><span className="admin-status good">{loaded ? 'Loaded' : 'Loading'}</span></div>
      <div className="admin-home-sections">{form.section_order.map((key) => <div className="admin-home-section" key={key}><label className="admin-check"><input type="checkbox" checked={form.visible_sections.includes(key)} onChange={() => toggle(key)} /><span><b>{SECTION_LABELS[key]}</b><small>{key}</small></span></label><input value={form.section_titles[key] ?? ''} onChange={(e) => setForm((f) => ({ ...f, section_titles: { ...f.section_titles, [key]: e.target.value } }))} placeholder={SECTION_LABELS[key]} /><div><button className="admin-icon-button" onClick={() => move(key, -1)} aria-label="Move up"><ArrowUp size={16} /></button><button className="admin-icon-button" onClick={() => move(key, 1)} aria-label="Move down"><ArrowDown size={16} /></button></div></div>)}</div>
      <p className="admin-muted">Sections are populated from the upstream catalogue. This editor controls visibility, display titles and ordering; it does not create or upload manga records. Popular remains in the right sidebar while the other sections follow the selected order.</p>
      <div className="admin-actions"><button className="admin-btn primary" onClick={() => run(() => saveHomepageSettings(form), 'Homepage configuration saved.')}>Save homepage layout</button></div>
    </section>
  </>;
}

function UsersManager({ admin, run }: { admin: AdminMe; run: (job: () => Promise<unknown>, success?: string) => Promise<unknown> }) {
  const [query, setQuery] = useState(''); const [role, setRole] = useState(''); const [status, setStatus] = useState(''); const [users, setUsers] = useState<AdminUser[]>([]); const [total, setTotal] = useState(0); const [page, setPage] = useState(1); const [loading, setLoading] = useState(false);
  const load = useCallback(async () => { setLoading(true); const r = await run(() => getAdminUsers({ page, per_page: 25, q: query, role, status })) as any; if (r?.data) { setUsers(r.data.items); setTotal(r.data.total); } setLoading(false); }, [page, query, role, status, run]);
  useEffect(() => { void load(); }, [load]);
  const changeStatus = async (u: AdminUser) => { if (!confirm(`${u.is_active ? 'Suspend' : 'Reactivate'} @${u.username}?`)) return; const r = await run(() => updateAdminUserStatus(u.id, !u.is_active), 'Account status updated.'); if (r) setUsers((old) => old.map((x) => x.id === u.id ? { ...x, is_active: !x.is_active } : x)); };
  const changeRole = async (u: AdminUser, newRole: AdminRole) => { if (u.role === newRole) return; if (!confirm(`Change @${u.username} role to ${newRole.replace('_', ' ')}?`)) return; const r = await run(() => updateAdminUserRole(u.id, newRole), 'User role updated.'); if (r) setUsers((old) => old.map((x) => x.id === u.id ? { ...x, role: newRole } : x)); };
  const canManage = admin.permissions.includes('*') || admin.permissions.includes('users.manage');
  return <><PageHeading eyebrow="PEOPLE / ACCOUNTS" title="User management" description="Review member accounts, account status and staff roles." />
    <section className="admin-panel"><div className="admin-filters"><div className="admin-search"><Search size={17} /><input value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && load()} placeholder="Search username, name or email…" /></div><select value={role} onChange={(e) => { setRole(e.target.value); setPage(1); }}><option value="">All roles</option>{['owner','admin','content_manager','moderator','user'].map((x) => <option key={x} value={x}>{x.replace('_', ' ')}</option>)}</select><select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}><option value="">All statuses</option><option value="active">Active</option><option value="suspended">Suspended</option></select><button className="admin-btn secondary" onClick={load}><Search size={15} /> Filter</button></div>
      <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Member</th><th>Role</th><th>Status</th><th>Joined</th><th>Last active</th><th>Actions</th></tr></thead><tbody>{users.map((u) => <tr key={u.id}><td><b>{u.display_name}</b><small>@{u.username} · {u.email}</small></td><td>{admin.role === 'owner' ? <select className="admin-inline-select" value={u.role} onChange={(e) => changeRole(u, e.target.value as AdminRole)}>{['user','moderator','content_manager','admin','owner'].map((x) => <option key={x} value={x}>{x.replace('_', ' ')}</option>)}</select> : <span className="admin-role-pill">{u.role.replace('_', ' ')}</span>}</td><td><span className={`admin-status ${u.is_active ? 'good' : 'bad'}`}>{u.is_active ? 'Active' : 'Suspended'}</span></td><td>{date(u.joined_at)}</td><td>{date(u.last_activity_at)}</td><td>{canManage ? <button className={`admin-btn tiny ${u.is_active ? 'danger' : 'secondary'}`} onClick={() => changeStatus(u)} disabled={u.id === admin.id}>{u.is_active ? 'Suspend' : 'Reactivate'}</button> : <span className="admin-muted">View only</span>}</td></tr>)}{!users.length && <tr><td colSpan={6} className="admin-empty">{loading ? 'Loading members…' : 'No matching users.'}</td></tr>}</tbody></table></div>
      <div className="admin-table-footer"><span>{fmt(total)} accounts</span><div><button className="admin-btn tiny secondary" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</button><span>Page {page}</span><button className="admin-btn tiny secondary" disabled={page * 25 >= total} onClick={() => setPage((p) => p + 1)}>Next</button></div></div>
    </section>
  </>;
}

function SystemManager({ run }: { run: (job: () => Promise<unknown>, success?: string) => Promise<unknown> }) {
  const [health, setHealth] = useState<Record<string, any> | null>(null); const [scraper, setScraper] = useState<Record<string, any> | null>(null); const [cacheInfo, setCacheInfo] = useState<Record<string, any> | null>(null);
  const refresh = async () => { const [h,s,c] = await Promise.all([run(getSystemHealth), run(getScraperStatus), run(getCacheStatus)]); if (h) setHealth(h as any); if (s) setScraper(s as any); if (c) setCacheInfo(c as any); };
  useEffect(() => { void refresh(); }, []);
  return <><PageHeading eyebrow="OPERATIONS / RELIABILITY" title="System & scraper" description="Inspect API dependencies, upstream reachability and the in-process cache." action={<button className="admin-btn secondary" onClick={refresh}><RefreshCw size={15} /> Run checks</button>} />
    <div className="admin-stat-grid"><StatCard label="API" value={health?.api ?? 'Checking'} detail="Current application process" icon={Zap} /><StatCard label="Database" value={health?.database ?? 'Checking'} detail="MongoDB connectivity" icon={Database} /><StatCard label="Source status" value={scraper?.status ?? 'Checking'} detail={scraper?.http_status ? `HTTP ${scraper.http_status}` : 'External manga source'} icon={Globe} /><StatCard label="Cache entries" value={cacheInfo?.items ?? '—'} detail={`${fmt(cacheInfo?.bytes)} bytes in this worker`} icon={Gauge} /></div>
    <div className="admin-overview-grid"><section className="admin-panel"><div className="admin-panel-heading"><div><span>UPSTREAM CONNECTIVITY</span><h2>Scraper diagnostic</h2></div><span className={`admin-status ${scraper?.status === 'reachable' ? 'good' : scraper ? 'bad' : ''}`}>{scraper?.status ?? 'Not checked'}</span></div><p className="admin-muted">A live homepage request is sent to the configured source. This can be affected by upstream rate limits or access policies.</p>{scraper?.error && <div className="admin-error-box"><AlertTriangle size={17} />{scraper.error}</div>}<div className="admin-detail-grid"><span>HTTP status<b>{scraper?.http_status ?? '—'}</b></span><span>Duration<b>{scraper?.duration_ms != null ? `${scraper.duration_ms} ms` : '—'}</b></span><span>Checked at<b>{date(scraper?.checked_at)}</b></span></div><button className="admin-btn secondary" onClick={async () => { const r = await run(getScraperStatus); if (r) setScraper(r as any); }}><RefreshCw size={15} /> Check source now</button></section>
      <section className="admin-panel"><div className="admin-panel-heading"><div><span>CACHE CONTROL</span><h2>Worker cache</h2></div><Database size={19} /></div><div className="admin-detail-grid"><span>Entries<b>{fmt(cacheInfo?.items)}</b></span><span>Bytes<b>{fmt(cacheInfo?.bytes)}</b></span><span>Max items<b>{fmt(cacheInfo?.max_items)}</b></span></div><p className="admin-muted">This is a process-local cache. With multiple Uvicorn workers, clearing it from this request clears only the worker handling the request.</p><button className="admin-btn danger" onClick={async () => { if (!confirm('Clear this worker cache?')) return; const r = await run(clearAdminCache, 'Cache cleared for the handling worker.'); if (r) await refresh(); }}><X size={15} /> Clear cache</button></section></div>
  </>;
}

function SettingsManager({ run }: { run: (job: () => Promise<unknown>, success?: string) => Promise<unknown> }) {
  const [form, setForm] = useState<SiteSettings>({ maintenance_mode: false, registration_enabled: true, announcement_enabled: false, announcement_title: '', announcement_body: '', announcement_link: '' });
  useEffect(() => { getSiteSettings().then(setForm).catch(() => undefined); }, []);
  const toggle = (key: 'maintenance_mode' | 'registration_enabled' | 'announcement_enabled') => setForm((f) => ({ ...f, [key]: !f[key] }));
  return <><PageHeading eyebrow="CONFIGURATION / WEBSITE" title="Site settings" description="Control public registration, maintenance mode and site-wide announcements." />
    <section className="admin-panel"><div className="admin-setting-list"><SettingToggle title="Maintenance mode" description="Temporarily block public API routes while keeping health, login and the private control center available." value={form.maintenance_mode} onClick={() => toggle('maintenance_mode')} danger /><SettingToggle title="New registrations" description="Allow or prevent creation of new member accounts." value={form.registration_enabled} onClick={() => toggle('registration_enabled')} /><SettingToggle title="Announcement banner" description="Display a site-wide notice on the public website." value={form.announcement_enabled} onClick={() => toggle('announcement_enabled')} /></div>
      <div className="admin-form-grid settings-fields"><label>Announcement title<input maxLength={100} value={form.announcement_title} onChange={(e) => setForm({ ...form, announcement_title: e.target.value })} /></label><label>Announcement link<input maxLength={500} value={form.announcement_link} onChange={(e) => setForm({ ...form, announcement_link: e.target.value })} placeholder="https://…" /></label><label className="wide">Announcement message<textarea maxLength={500} value={form.announcement_body} onChange={(e) => setForm({ ...form, announcement_body: e.target.value })} /></label></div>
      <div className="admin-note"><AlertTriangle size={17} /><span>Maintenance mode blocks public API requests. Keep this control center and authentication available so administrators can turn maintenance off.</span></div>
      <div className="admin-actions"><button className="admin-btn primary" onClick={() => run(() => saveSiteSettings(form), 'Website settings saved.')}>Save settings</button></div>
    </section>
  </>;
}
function SettingToggle({ title, description, value, onClick, danger = false }: { title: string; description: string; value: boolean; onClick: () => void; danger?: boolean }) { return <div className="admin-setting-row"><div><b>{title}</b><p>{description}</p></div><button className={`admin-switch ${value ? 'on' : ''} ${danger && value ? 'danger' : ''}`} onClick={onClick} aria-pressed={value}><i /></button></div>; }

function AuditManager({ run }: { run: (job: () => Promise<unknown>, success?: string) => Promise<unknown> }) {
  const [items, setItems] = useState<any[]>([]); const [total, setTotal] = useState(0); const [page, setPage] = useState(1);
  const load = useCallback(async () => { const r = await run(() => getAdminAudit(page)) as any; if (r?.data) { setItems(r.data.items); setTotal(r.data.total); } }, [page, run]);
  useEffect(() => { void load(); }, [load]);
  return <><PageHeading eyebrow="SECURITY / ACCOUNTABILITY" title="Audit history" description="A record of privileged actions performed through the control center." action={<button className="admin-btn secondary" onClick={load}><RefreshCw size={15} /> Refresh</button>} />
    <section className="admin-panel"><div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Action</th><th>Administrator</th><th>Target</th><th>Time</th></tr></thead><tbody>{items.map((item) => <tr key={item.id}><td><b>{item.action}</b><small>{JSON.stringify(item.details ?? {})}</small></td><td>{item.actor_username}<small>{item.actor_role}</small></td><td>{item.target_type}<small className="mono">{item.target_id || '—'}</small></td><td>{date(item.created_at)}</td></tr>)}{!items.length && <tr><td colSpan={4} className="admin-empty">No administrative actions have been recorded yet.</td></tr>}</tbody></table></div><div className="admin-table-footer"><span>{fmt(total)} events</span><div><button className="admin-btn tiny secondary" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</button><span>Page {page}</span><button className="admin-btn tiny secondary" disabled={page * 30 >= total} onClick={() => setPage((p) => p + 1)}>Next</button></div></div></section>
  </>;
}
