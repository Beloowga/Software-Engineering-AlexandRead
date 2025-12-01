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
    navigate('/account');
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
        <Link to="/" className="brand">
          AlexandRead
        </Link>
        <nav className="navbar__links">
          <Link to="/">Home</Link>
          <div className="navbar__actions">
            <Link
              to="/subscription"
              className={`subscription-link ${isSubscribed ? 'is-active' : ''}`}
            >
              <span className="subscription-icon" aria-hidden="true">
                {isSubscribed ? '👑' : '+'}
              </span>
              <span>{isSubscribed ? 'Premium' : 'Subscribe'}</span>
            </Link>
            {initializing ? (
              <span className="account-loading">Loading account…</span>
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
                      View account details
                    </button>
                    <button type="button" onClick={handleLogout}>
                      Disconnect
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}
