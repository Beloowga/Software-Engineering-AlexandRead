import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

function HeartIcon({ active }) {
  const color = '#ff6fb7';
  return (
    <svg
      viewBox="0 0 24 24"
      fill={active ? color : 'none'}
      stroke={color}
      strokeWidth="1.7"
      aria-hidden="true"
    >
      <path
        d="M12 21s-6.5-4.35-9.2-8.41C1.2 10.14 1 7.5 2.8 5.68 4.3 4.18 6.7 4.2 8.2 5.7L12 9.5l3.8-3.8c1.5-1.5 3.9-1.52 5.4-0.02 1.8 1.82 1.6 4.46 0 6.91C18.5 16.65 12 21 12 21z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function SaveBookButton({ bookId, variant = 'detail' }) {
  const { isAuthenticated, toggleSavedBook, isBookSaved } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const saved = isBookSaved ? isBookSaved(bookId) : false;

  const handleClick = async (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (!bookId || loading) return;

    if (!isAuthenticated) {
      navigate('/auth', { state: { from: location.pathname, mode: 'signin' } });
      return;
    }

    try {
      setLoading(true);
      await toggleSavedBook(bookId);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      className={`save-btn save-btn--${variant} ${saved ? 'is-saved' : ''}`}
      onClick={handleClick}
      aria-pressed={saved}
      aria-label={saved ? 'Remove from library' : 'Save to my library'}
      disabled={loading}
    >
      <HeartIcon active={saved} />
    </button>
  );
}
