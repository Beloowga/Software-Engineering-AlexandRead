import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Navbar() {
  const { user, logout, initializing } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);
  const isSubscribed = Boolean(user?.subscription?.isActive);
  const isAdmin = (user?.role || '').toString().toLowerCase() === 'admin';
  const isAdminMode = isAdmin || location.pathname.startsWith('/admin');

  useEffect(() => {
    function handleClickOutside(event) {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(event.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  const handleAuthNavigation = () => {
    navigate('/auth', { state: { from: location.pathname, mode: 'signin' } });
  };

  const handleAccountDetails = () => {
    setOpen(false);
    navigate(isAdmin ? '/admin' : '/account');
  };

  const handleLogout = () => {
    logout();
    setOpen(false);
  };

  const displayName = user?.pseudo || user?.name || user?.email;
  const avatarUrl = user?.avatarUrl;
  const initials = displayName ? displayName.charAt(0).toUpperCase() : '?';

  return (
    <header className="navbar">
      <div className="navbar__content">
        <nav className="navbar__links">
          <Link to="/" className="home-link">
            <svg
              aria-hidden="true"
              focusable="false"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 11.5 12 4l9 7.5" />
              <path d="M5 10v10h14V10" />
              <path d="M9 20v-6h6v6" />
            </svg>
            <span>Home</span>
          </Link>
          <Link
            to="/activity"
            className="home-link activity-link"
            onClick={(event) => {
              if (!user) {
                event.preventDefault();
                navigate('/auth', { state: { from: location.pathname, mode: 'signin' } });
              }
            }}
          >
            <svg
              aria-hidden="true"
              focusable="false"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M5 4h14v3H5z" />
              <path d="M5 10h14v10H5z" />
              <path d="M9 10v10" />
              <path d="M15 10v10" />
            </svg>
            <span>My activity</span>
          </Link>
        </nav>
        <Link to="/" className="brand">
          AlexandRead
        </Link>
        <div className="navbar__actions">
            {!isAdminMode && (
              <Link
                to="/subscription"
                className={`subscription-link ${isSubscribed ? 'is-active' : ''}`}
              >
                <span className="subscription-icon" aria-hidden="true">
                  {isSubscribed ? '👑' : '+'}
                </span>
                <span>{isSubscribed ? 'Premium' : 'Subscribe'}</span>
              </Link>
            )}
            {isAdmin && <span className="admin-chip">Admin mode</span>}
            {initializing ? (
              <span className="account-loading">Loading accountƒ?İ</span>
            ) : !user ? (
              <button type="button" className="auth-btn" onClick={handleAuthNavigation}>
                Sign In / Register
              </button>
            ) : (
              <div className="account-menu" ref={menuRef}>
                <button
                  type="button"
                  className="account-trigger"
                  onClick={() => setOpen((prev) => !prev)}
                >
                  <span className="account-avatar">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt={`${displayName} avatar`} />
                    ) : (
                      initials
                    )}
                  </span>
                  <span className="account-name">{displayName}</span>
                </button>
                {open && (
                  <div className="account-dropdown">
                    <button type="button" onClick={handleAccountDetails}>
                      {isAdmin ? 'Open admin interface' : 'View account details'}
                    </button>
                    <button type="button" onClick={handleLogout}>
                      Disconnect
                    </button>
                  </div>
                )}
              </div>
            )}
        </div>
      </div>
    </header>
  );
}
