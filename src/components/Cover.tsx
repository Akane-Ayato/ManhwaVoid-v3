import { useState } from 'react';

interface Props {
  src?: string;
  alt: string;
  className?: string;
  eager?: boolean;
}

/** Cover image with lazy loading, no-referrer (avoids hotlink blocks) and a letter fallback. */
export default function Cover({ src, alt, className = '', eager = false }: Props) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) {
    return (
      <div className={`cover-fallback ${className}`} role="img" aria-label={alt}>
        {alt.trim().charAt(0).toUpperCase() || '?'}
      </div>
    );
  }
  return (
    <img
      className={className}
      src={src}
      alt={alt}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
    />
  );
}
