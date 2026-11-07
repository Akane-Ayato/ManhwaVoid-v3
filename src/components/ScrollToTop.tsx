import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/** Scroll to top on navigation between pages (not on query-only changes like pagination). */
export default function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}
