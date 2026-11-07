import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Trash2 } from 'lucide-react';
import Cover from '../../components/Cover';
import Pagination from '../../components/Pagination';
import { EmptyState, ErrorState, Spinner } from '../../components/States';
import { useToast } from '../../context/ToastContext';
import { useAsync } from '../../hooks/useAsync';
import { clearHistory, getHistory } from '../../lib/api';
import { chapterLabel, timeAgo } from '../../lib/format';
import { toApiError } from '../../lib/http';
import { imageUrl } from '../../lib/images';

export default function HistoryTab() {
  const [page, setPage] = useState(1);
  const toast = useToast();
  const list = useAsync(() => getHistory(page, 20), [page], true);

  const clear = async () => {
    if (!window.confirm('Clear your entire reading history? This cannot be undone.')) return;
    try {
      const { deleted } = await clearHistory();
      toast.success(`Cleared ${deleted} entr${deleted === 1 ? 'y' : 'ies'}`);
      setPage(1);
      list.reload();
    } catch (err) { toast.error(toApiError(err).message); }
  };

  if (list.error && !list.data) return <ErrorState error={list.error} onRetry={list.reload} />;
  if (!list.data) return <Spinner />;
  const { data: { items, total }, pagination } = list.data;
  if (!items.length) return <EmptyState title="No reading history yet">Chapters you open will be listed here.</EmptyState>;

  return (
    <>
      <div className="tab-head">
        <h2 className="tab-title">Reading history <small>{total}</small></h2>
        <button className="btn btn-danger-outline btn-sm" onClick={clear}><Trash2 size={14} /> Clear all</button>
      </div>
      <ul className="row-list">
        {items.map((h) => (
          <li key={h.id}>
            <Link to={`/title/${h.manga_slug}/chapter/${h.chapter_number}`} className="row-item">
              <Cover src={imageUrl(h.cover)} alt={h.manga_title} />
              <span><b>{h.manga_title}</b><small>{h.chapter_title || chapterLabel(h.chapter_number)} · {timeAgo(h.read_at)}</small></span>
              <em className="row-cta">Continue</em>
            </Link>
          </li>
        ))}
      </ul>
      <Pagination page={page} totalPages={pagination?.total_pages ?? 1} onChange={setPage} />
    </>
  );
}
