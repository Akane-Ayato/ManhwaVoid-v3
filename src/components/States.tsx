import type { ReactNode } from 'react';
import { CircleAlert, Inbox, Loader2, RotateCw } from 'lucide-react';
import type { ApiError } from '../lib/http';

export function Spinner({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="state" role="status">
      <Loader2 className="spin" size={28} />
      <span>{label}</span>
    </div>
  );
}

export function ErrorState({ error, onRetry, title = 'Something went wrong' }: { error: ApiError | string; onRetry?: () => void; title?: string }) {
  const message = typeof error === 'string' ? error : error.message;
  const status = typeof error === 'string' ? 0 : error.status;
  return (
    <div className="state state-error" role="alert">
      <CircleAlert size={30} />
      <strong>{status === 404 ? 'Not found' : title}</strong>
      <span>{message}</span>
      {onRetry && status !== 404 && (
        <button className="btn btn-secondary" onClick={onRetry}><RotateCw size={15} /> Try again</button>
      )}
    </div>
  );
}

export function EmptyState({ title = 'Nothing here yet', children }: { title?: string; children?: ReactNode }) {
  return (
    <div className="state">
      <Inbox size={30} />
      <strong>{title}</strong>
      {children && <span>{children}</span>}
    </div>
  );
}

export function CardGridSkeleton({ count = 12, className = 'card-grid' }: { count?: number; className?: string }) {
  return (
    <div className={className} aria-hidden="true">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="manga-card skeleton-card">
          <div className="manga-card-cover skeleton" />
          <div className="skeleton skeleton-line" />
          <div className="skeleton skeleton-line short" />
        </div>
      ))}
    </div>
  );
}
