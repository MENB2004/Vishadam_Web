// VISHADAM — Main App with Routing

import { BrowserRouter, Routes, Route, NavLink, Link, useLocation } from 'react-router-dom';
import { useEffect, useState, lazy, Suspense } from 'react';
import './App.css';

const Home = lazy(() => import('./pages/Home'));
const Result = lazy(() => import('./pages/Result'));
const Feed = lazy(() => import('./pages/Feed'));
const About = lazy(() => import('./pages/About'));

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, [pathname]);
  return null;
}

const NAV_ITEMS = [
  { to: '/', label: 'Home', end: true },
  { to: '/feed', label: 'Live Feed', end: false },
  { to: '/about', label: 'About', end: false },
];

function AppNav() {
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = () => setMenuOpen(false);

  // Close the mobile drawer on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeMenu();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Prevent background scroll while the drawer is open
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  return (
    <nav className="nav" id="main-nav" aria-label="Main navigation">
      <NavLink to="/" className="nav-logo" onClick={closeMenu}>
        <span className="logo-accent">VISHADAM</span>
        <span className="logo-ml">വിഷാദം</span>
      </NavLink>

      <button
        className={`menu-toggle ${menuOpen ? 'open' : ''}`}
        aria-label={menuOpen ? 'Close menu' : 'Open menu'}
        aria-expanded={menuOpen}
        aria-controls="mobile-menu"
        onClick={() => setMenuOpen(o => !o)}
      >
        <span className="menu-bar" />
        <span className="menu-bar" />
        <span className="menu-bar" />
      </button>

      <div
        className={`nav-links ${menuOpen ? 'open' : ''}`}
        id="mobile-menu"
      >
        {NAV_ITEMS.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            end={item.end}
            onClick={closeMenu}
          >
            {item.label}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}

function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <div className="grain" aria-hidden="true" />
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>
      <AppNav />

      <main className="main-content" id="main-content">
        <AnimatedRoutes />
      </main>

      <footer className="footer">
        <p>VISHADAM (വിഷാദം) — "Come in a mood, leave worse." — 0% encouragement guaranteed.</p>
        <p className="footer-help">
          Going through something serious?{' '}
          <Link to="/about">Crisis resources are here</Link>.
        </p>
      </footer>
    </BrowserRouter>
  );
}

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <div className="page-transition" key={location.pathname}>
      <Suspense
        fallback={
          <div className="route-loading" role="status" aria-live="polite">
            <div className="processing-skull" aria-hidden="true">💀</div>
          </div>
        }
      >
        <Routes location={location}>
          <Route path="/" element={<Home />} />
          <Route path="/result" element={<Result />} />
          <Route path="/feed" element={<Feed />} />
          <Route path="/about" element={<About />} />
        </Routes>
      </Suspense>
    </div>
  );
}

export default App;
