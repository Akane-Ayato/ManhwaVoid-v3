import { useState } from 'react';
import { imageUrl } from '../lib/images';
import type { User } from '../types/api';

export default function Avatar({ user, size = 36, className = '' }: { user?: Pick<User, 'avatar' | 'display_name'> | null; size?: number; className?: string }) {
  const [failed, setFailed] = useState(false);
  const src = imageUrl(user?.avatar?.url);
  const style = { width: size, height: size };
  if (!src || failed) {
    return <span className={`avatar avatar-fallback ${className}`} style={style}>{user?.display_name?.charAt(0).toUpperCase() || '?'}</span>;
  }
  return <img className={`avatar ${className}`} style={style} src={src} alt="" referrerPolicy="no-referrer" onError={() => setFailed(true)} />;
}
