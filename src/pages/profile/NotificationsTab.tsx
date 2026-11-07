import { useState } from 'react';
import { ErrorState, Spinner } from '../../components/States';
import { useToast } from '../../context/ToastContext';
import { useAsync } from '../../hooks/useAsync';
import { getPreferences, updatePreferences } from '../../lib/api';
import { toApiError } from '../../lib/http';
import type { NotificationPreferences } from '../../types/api';

const OPTIONS: { key: keyof NotificationPreferences; title: string; text: string }[] = [
  { key: 'email_updates', title: 'Email updates', text: 'New chapters of the titles you bookmarked.' },
  { key: 'reading_reminders', title: 'Reading reminders', text: 'A nudge when you haven’t read for a while.' },
  { key: 'product_announcements', title: 'Product announcements', text: 'News about new features on the site.' },
];

export default function NotificationsTab() {
  const prefs = useAsync(getPreferences, []);
  const toast = useToast();
  const [saving, setSaving] = useState<string | null>(null);
  const [local, setLocal] = useState<NotificationPreferences | null>(null);

  if (prefs.loading) return <Spinner />;
  if (prefs.error || !prefs.data) return <ErrorState error={prefs.error ?? 'Could not load preferences.'} onRetry={prefs.reload} />;
  const current = local ?? prefs.data;

  const toggle = async (key: keyof NotificationPreferences) => {
    const next = { ...current, [key]: !current[key] };
    setLocal(next);
    setSaving(key);
    try { setLocal(await updatePreferences(next)); toast.success('Preferences saved'); }
    catch (err) { setLocal(current); toast.error(toApiError(err).message); }
    finally { setSaving(null); }
  };

  return (
    <>
      <h2 className="tab-title">Notifications</h2>
      <ul className="switch-list">
        {OPTIONS.map((o) => (
          <li key={o.key}>
            <div><b>{o.title}</b><small>{o.text}</small></div>
            <button role="switch" aria-checked={current[o.key]} aria-label={o.title} className={`switch ${current[o.key] ? 'on' : ''}`} disabled={saving === o.key} onClick={() => toggle(o.key)}><i /></button>
          </li>
        ))}
      </ul>
    </>
  );
}
