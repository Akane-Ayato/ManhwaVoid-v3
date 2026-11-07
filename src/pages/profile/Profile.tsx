import { useSearchParams } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import Avatar from '../../components/Avatar';
import { useAuth } from '../../context/AuthContext';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { formatMonthYear } from '../../lib/format';
import SummaryTab from './SummaryTab';
import BookmarksTab from './BookmarksTab';
import HistoryTab from './HistoryTab';
import NotificationsTab from './NotificationsTab';
import ExportTab from './ExportTab';
import SettingsTab from './SettingsTab';

const TABS = [
  { id: 'summary', label: 'Summary', Component: SummaryTab },
  { id: 'bookmark', label: 'Bookmarks', Component: BookmarksTab },
  { id: 'history', label: 'History', Component: HistoryTab },
  { id: 'notifications', label: 'Notifications', Component: NotificationsTab },
  { id: 'export', label: 'Export', Component: ExportTab },
  { id: 'settings', label: 'Settings', Component: SettingsTab },
] as const;

export default function Profile() {
  const { user, logout } = useAuth();
  const [params, setParams] = useSearchParams();
  const active = TABS.find((t) => t.id === params.get('tab')) ?? TABS[0];
  useDocumentTitle(`${active.label} · Profile`);

  if (!user) return null; // ProtectedRoute guarantees a user

  const Active = active.Component;
  return (
    <div className="container profile">
      <div className="profile-head">
        <Avatar user={user} size={112} className="profile-avatar" />
        <div className="profile-id">
          <h1>{user.display_name}</h1>
          <p className="muted">{user.email}</p>
          <p className="muted">Member since {formatMonthYear(user.joined_at)}</p>
          <p className="online"><i /> Online</p>
        </div>
        <button className="btn btn-danger-outline" onClick={logout}><LogOut size={16} /> Log out</button>
      </div>

      <div className="tabs" role="tablist">
        {TABS.map((t) => (
          <button key={t.id} role="tab" aria-selected={t.id === active.id} className={t.id === active.id ? 'active' : ''} onClick={() => setParams({ tab: t.id })}>{t.label}</button>
        ))}
      </div>

      <div className="tab-panel"><Active /></div>
    </div>
  );
}
