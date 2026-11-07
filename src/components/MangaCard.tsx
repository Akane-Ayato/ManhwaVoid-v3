import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import Cover from './Cover';
import TypeBadge from './TypeBadge';
import { chapterLabel, timeAgo } from '../lib/format';
import { imageUrl, rememberCover } from '../lib/images';
import type { MangaCard as Manga } from '../types/api';

interface Props {
  manga: Manga;
  /** 1-based rank badge (Trending) */
  rank?: number;
  /** fall back to this type when the API card has none (e.g. a type filter is active) */
  fallbackType?: string;
  className?: string;
}

export default function MangaCard({ manga, rank, fallbackType, className = '' }: Props) {
  const cover = imageUrl(manga.cover);
  useEffect(() => { rememberCover(manga.slug, cover); }, [manga.slug, cover]);
  const chapter = chapterLabel(manga.latest_chapter);
  const when = timeAgo(manga.updated_at);

  return (
    <Link to={`/title/${manga.slug}`} className={`manga-card ${className}`} title={manga.title}>
      <div className="manga-card-cover">
        <Cover src={cover} alt={manga.title} />
        <TypeBadge type={manga.type || fallbackType} />
        {rank ? <span className={`rank rank-${Math.min(rank, 4)}`}>{rank}</span> : null}
      </div>
      <div className="manga-card-meta">
        <span>{chapter}</span>
        <span>{when}</span>
      </div>
      <h3 className="manga-card-title">{manga.title}</h3>
    </Link>
  );
}
