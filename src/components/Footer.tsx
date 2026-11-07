import { Link } from 'react-router-dom';
import { SITE } from '../config';
import Logo from './Logo';
import { useInstall } from '../lib/pwa';

export default function Footer() {
  const install = useInstall();
  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div className="footer-brand">
          <Logo size={44} />
          <p>{SITE.tagline} Updated daily with high-quality chapter scans.</p>
        </div>
        <nav aria-label="Discover">
          <h4>Discover</h4>
          <Link to="/browse">Browse All</Link>
          <Link to="/browse?sort=latest">Latest Updates</Link>
          <Link to="/browse?sort=popular">Popular</Link>
          <Link to="/browse?sort=rating">Top Rated</Link>
        </nav>
        <nav aria-label="Explore">
          <h4>Explore</h4>
          <Link to="/browse?type=Manga">Manga</Link>
          <Link to="/browse?type=Manhwa">Manhwa</Link>
          <Link to="/browse?type=Manhua">Manhua</Link>
          <Link to="/browse?type=Webtoon">Webtoons</Link>
        </nav>
        <nav aria-label="My account">
          <h4>My Account</h4>
          <Link to="/profile?tab=bookmark">Bookmarks</Link>
          <Link to="/profile?tab=history">Reading History</Link>
          <Link to="/profile?tab=summary">My Profile</Link>
          <Link to="/profile?tab=settings">Settings</Link>
          {install.available && <button className="footer-link" onClick={install.install}>Install app</button>}
        </nav>
      </div>
      <div className="container footer-legal">
        © {new Date().getFullYear()} {SITE.name}. Chapter images are hosted by third-party services.
      </div>
    </footer>
  );
}
