import { Outlet } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import InstallDialog from './InstallDialog';
import SiteAnnouncement from './SiteAnnouncement';

export default function Layout() {
  return (
    <>
      <Header />
      <SiteAnnouncement />
      <main className="site-main">
        <Outlet />
      </main>
      <Footer />
      <InstallDialog />
    </>
  );
}
