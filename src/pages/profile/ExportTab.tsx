import { useState } from 'react';
import { Download } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { exportAccount } from '../../lib/api';
import { toApiError } from '../../lib/http';

export default function ExportTab() {
  const toast = useToast();
  const [busy, setBusy] = useState(false);

  const download = async () => {
    setBusy(true);
    try {
      const data = await exportAccount();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = Object.assign(document.createElement('a'), { href: url, download: `account-export-${new Date().toISOString().slice(0, 10)}.json` });
      document.body.append(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success('Export downloaded');
    } catch (err) { toast.error(toApiError(err).message); }
    finally { setBusy(false); }
  };

  return (
    <>
      <h2 className="tab-title">Export your data</h2>
      <p className="muted">Download your profile, bookmarks and reading history as a JSON file.</p>
      <button className="btn btn-primary" onClick={download} disabled={busy}><Download size={16} /> {busy ? 'Preparing…' : 'Download export'}</button>
    </>
  );
}
