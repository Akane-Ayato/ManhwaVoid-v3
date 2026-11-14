import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes, useLocation, useParams } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import ScrollToTop from './components/ScrollToTop';
import { Spinner } from './components/States';
import Home from './pages/Home';
import Browse from './pages/Browse';
import Title from './pages/Title';
import NotFound from './pages/NotFound';
const AdminGate = lazy(() => import('./components/AdminGate')); 

// Heavier / less common pages are split into their own chunks.
const Reader = lazy(() => import('./pages/Reader'));
const Profile = lazy(() => import('./pages/profile/Profile'));
const PublicProfile = lazy(() => import('./pages/PublicProfile'));
const Login = lazy(() => import('./pages/Auth').then((m) => ({ default: m.Login })));
const Register = lazy(() => import('./pages/Auth').then((m) => ({ default: m.Register })));

/* Legacy URLs from the previous frontend / the source site */
const LegacyRead = () => {
  const { slug = '', chapter = '' } = useParams();
  return <Navigate replace to={`/title/${slug}/chapter/${chapter}`} />;
};
const LegacySearch = () => {
  const { search } = useLocation();
  return <Navigate replace to={`/browse${search}`} />;
};

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Suspense fallback={<Spinner />}>
        <Routes>
          {/* Reader and auth pages have their own chrome */}
          <Route path="/title/:slug/chapter/:chapter" element={<Reader />} />
          <Route path="/read/:slug/:chapter" element={<LegacyRead />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          {/* Private control-center entry point. Authorization is enforced by the API, not by this route. */}
          <Route path="/quanxi" element={<AdminGate />} />

          <Route element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="/browse" element={<Browse />} />
            <Route path="/search" element={<LegacySearch />} />
            <Route path="/title/:slug" element={<Title />} />
            <Route path="/user/:username" element={<PublicProfile />} />
            <Route element={<ProtectedRoute />}>
              <Route path="/profile" element={<Profile />} />
              <Route path="/history" element={<Navigate replace to="/profile?tab=history" />} />
              <Route path="/library" element={<Navigate replace to="/profile?tab=bookmark" />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </Suspense>
    </>
  );
}
