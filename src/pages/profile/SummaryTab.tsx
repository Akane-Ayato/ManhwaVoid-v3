import { Link } from 'react-router-dom';
import Cover from '../../components/Cover';
import { EmptyState, ErrorState, Spinner } from '../../components/States';
import { useAsync } from '../../hooks/useAsync';
import { getActivity, getHistory, getSummary } from '../../lib/api';
import { chapterLabel, timeAgo } from '../../lib/format';
import { imageUrl } from '../../lib/images';

export default function SummaryTab() {
  const summary = useAsync(getSummary, []);
  const history = useAsync(() => getHistory(1, 6).then((r) => r.data.items), []);
  const activity = useAsync(() => getActivity(8), []);

  if (summary.loading) return <Spinner />;
  if (summary.error || !summary.data) return <ErrorState error={summary.error ?? 'Could not load your summary.'} onRetry={summary.reload} />;
  const s = summary.data;

  return (
    <>
      <div className="stat-grid">
        <div className="stat"><b>{s.bookmarked}</b><span>Bookmarked</span></div>
        <div className="stat"><b>{s.total_chapters_read}</b><span>Chapters read</span></div>
        <div className="stat"><b>{s.last_read_at ? timeAgo(s.last_read_at) : 'Never'}</b><span>Last read</span></div>
        <div className="stat"><b>{s.last_activity_at ? timeAgo(s.last_activity_at) : '—'}</b><span>Last activity</span></div>
      </div>

      <div className="split">
        <section>
          <h2 className="tab-title">History</h2>
          {history.loading ? <Spinner /> : !history.data?.length ? <EmptyState title="No reading history yet">Open a chapter and it will show up here.</EmptyState> : (
            <ul className="row-list">
              {history.data.map((h) => (
                <li key={h.id}>
                  <Link to={`/title/${h.manga_slug}/chapter/${h.chapter_number}`} className="row-item">
                    <Cover src={imageUrl(h.cover)} alt={h.manga_title} />
                    <span><b>{h.manga_title}</b><small>{chapterLabel(h.chapter_number)} · {timeAgo(h.read_at)}</small></span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <h2 className="tab-title">Recent activity</h2>
          {activity.loading ? <Spinner /> : !activity.data?.length ? <EmptyState title="No activity yet" /> : (
            <ul className="activity-list">
              {activity.data.map((a) => <li key={a.id}><span>{a.description}</span><small>{timeAgo(a.created_at)}</small></li>)}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}
