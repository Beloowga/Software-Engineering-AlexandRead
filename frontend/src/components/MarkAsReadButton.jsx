import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

function CheckmarkIcon({ active }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill={active ? '#22c55e' : 'none'}
      stroke={active ? '#22c55e' : '#64748b'}
      strokeWidth="2"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" />
      {active && (
        <path
          d="M9 12l2 2l4-4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
    </svg>
  );
}

export default function MarkAsReadButton({ bookId, variant = 'detail' }) {
  const { isAuthenticated, isBookRead, addReadBook } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const read = isBookRead ? isBookRead(bookId) : false;

  const handleClick = async (event) => {
    event.preventDefault();
    event.stopPropagation();
    console.log('[MarkAsReadButton] click', { bookId, isAuthenticated, read, loading });
    if (!bookId || loading || read) return;

    if (!isAuthenticated) {
      navigate('/auth', { state: { from: location.pathname, mode: 'signin' } });
      return;
    }

    try {
      setLoading(true);
      await addReadBook(bookId);
    } catch (err) {
      console.error('Error marking book as read:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      className={`read-btn read-btn--${variant} ${read ? 'is-read' : ''}`}
      onClick={handleClick}
      aria-pressed={read}
      aria-label={read ? 'Already read' : 'Mark as read'}
      disabled={loading}
      title={read ? 'You have read this book' : 'Mark this book as read'}
    >
      <CheckmarkIcon active={read} />
    </button>
  );
}
