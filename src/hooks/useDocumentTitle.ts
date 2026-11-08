import { useEffect } from 'react';
import { SITE } from '../config';

export function useDocumentTitle(title?: string | null) {
  useEffect(() => {
    document.title = title ? `${title} — ${SITE.name}` : `${SITE.name} — Read Manga Online`;
  }, [title]);
}
