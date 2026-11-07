import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Trash2 } from 'lucide-react';
import Cover from '../../components/Cover';
import Pagination from '../../components/Pagination';
import TypeBadge from '../../components/TypeBadge';
import { CardGridSkeleton, EmptyState, ErrorState } from '../../components/States';
import { useBookmarks } from '../../context/BookmarksContext';
import { useToast } from '../../context/ToastContext';
import { useAsync } from '../../hooks/useAsync';
import { getBookmarks, removeBookmark } from '../../lib/api';
import { toApiError } from '../../lib/http';
import { imageUrl } from '../../lib/images';

const PER_PAGE = 24;

export default function BookmarksTab() {
  const [page, setPage] = useState(1);
  const toast = useToast();
  const bookmarks = useBookmarks();
  const list = useAsync(() => getBookmarks(page, PER_PAGE), [page], true);

  const remove = async (slug: string) => {
    try {
      await removeBookmark(slug);
      bookmarks.forget(slug);
      toast.success('Removed from bookmarks');
      // Step back a page if we just emptied the last one.
      if (list.data?.data.items.length === 1 && page > 1) setPage(page - 1); else list.reload();
    } catch (err) { toast.error(toApiError(err).message); }
  };

  if (list.error && !list.data) return <ErrorState error={list.error} onRetry={list.reload} />;
  if (!list.data) return <CardGridSkeleton count={8} />;

  const { data: { items, total }, pagination } = list.data;
  if (!items.length) return <EmptyState title="No bookmarks yet">Press “Bookmark” on any title and it will appear here.</EmptyState>;

  return (
    <>
      <h2 className="tab-title">Bookmarks <small>{total}</small></h2>
      <div className="card-grid">
        {items.map((b) => (
          <div key={b.id} className="manga-card bookmark-card">
            <Link to={`/title/${b.manga_slug}`} className="manga-card-cover">
              <Cover src={imageUrl(b.cover)} alt={b.manga_title} />
              <TypeBadge type={b.manga_type} />
            </Link>
            <Link to={`/title/${b.manga_slug}`}><h3 className="manga-card-title">{b.manga_title}</h3></Link>
            <button className="btn btn-danger-outline btn-sm btn-block" onClick={() => remove(b.manga_slug)}><Trash2 size={14} /> Remove</button>
          </div>
        ))}
      </div>
      <Pagination page={page} totalPages={pagination?.total_pages ?? 1} onChange={setPage} />
    </>
  );
}
