import { lazy, Suspense, useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getAdminMe, type AdminMe } from '../lib/adminAuthApi';
import { Spinner } from './States';
const AdminPage = lazy(() => import('../pages/Admin'));

export default function AdminGate() {
  const { user, loading } = useAuth();
  const location = useLocation();
  const [admin, setAdmin] = useState<AdminMe | null>(null);
  const [checking, setChecking] = useState(true);
  const [denied, setDenied] = useState(false);

  useEffect(() => {
    let alive = true;
    if (!user) { setChecking(false); setAdmin(null); return; }
    setChecking(true);
    getAdminMe().then((value) => { if (alive) { setAdmin(value); setDenied(false); } })
      .catch((error: { status?: number }) => { if (alive) { setAdmin(null); setDenied(error?.status === 403 || error?.status === 404); } })
      .finally(() => { if (alive) setChecking(false); });
    return () => { alive = false; };
  }, [user?.id]);

  if (loading || checking) return <Spinner label="Verifying administrator access…" />;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  if (denied || !admin) return (
    <main className="admin-denied">
      <div><h1>Access restricted</h1><p>This account does not have permission to access the control center.</p><a className="btn btn-primary" href="/">Return to website</a></div>
    </main>
  );
  return <Suspense fallback={<Spinner label="Loading control center…" />}><AdminPage admin={admin} /></Suspense>;
}
