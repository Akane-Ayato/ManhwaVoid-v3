import { Outlet } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import InstallDialog from './InstallDialog';

export default function Layout() {
  return (
    <>
      <Header />
      <main className="site-main">
        <Outlet />
      </main>
      <Footer />
      <InstallDialog />
    </>
  );
}
