import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

function StarIcon({ active }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill={active ? '#f4c542' : 'none'}
      stroke="#f4c542"
      strokeWidth="1.7"
      aria-hidden="true"
    >
      <path
        d="M12 3.5l2.4 5 5.5.8-4 4 0.9 5.7L12 16.9l-4.8 2.7 0.9-5.7-4-4 5.5-.8z"
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
      <StarIcon active={saved} />
    </button>
  );
}
