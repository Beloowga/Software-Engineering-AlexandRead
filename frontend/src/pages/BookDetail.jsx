import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api.js';
import Loader from '../components/Loader.jsx';
import { buildCoverUrl, buildBookContentUrl } from '../utils/storageUrls.js';
import SaveBookButton from '../components/SaveBookButton.jsx';
import { useAuth } from '../context/AuthContext.jsx';

export default function BookDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchBook() {
      try {
        const res = await api.get(`/books/${id}`);
        setBook(res.data);
      } catch (err) {
        console.error(err);
        setError('Book not found.');
      } finally {
        setLoading(false);
      }
    }
    fetchBook();
  }, [id]);

  if (loading) return <Loader />;
  if (error) return <p className="error">{error}</p>;
  if (!book) return null;

  const coverUrl = buildCoverUrl(book.cover_image);
  const contentUrl = buildBookContentUrl(book.content);
  const isPremium = Boolean(book.premium);
  const isSubscriber = Boolean(user?.subscription?.isActive);
  const canAccessContent = !isPremium || isSubscriber;

  return (
    <div className="book-detail">
      <Link to="/" className="back-link">Back to previous page</Link>

      <div className="book-detail__head">
        {coverUrl ? (
          <img
            src={coverUrl}
            alt={book.title}
            className="book-detail__cover"
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.parentNode.innerHTML =
                '<div class="book-detail__cover placeholder">No cover</div>';
            }}
          />
        ) : (
          <div className="book-detail__cover placeholder">No cover</div>
        )}

        <div className="book-detail__meta-col">
          <div className="book-detail__title-row">
            <h1>{book.title}</h1>
            {isPremium && <span className="premium-badge">Premium</span>}
            <SaveBookButton bookId={book.id} variant="detail" />
          </div>
          <p className="book-detail__author">{book.author}</p>
          <p className="book-detail__meta">
            {book.genre}{book.year ? ` - ${book.year}` : ''}
          </p>

          {contentUrl && (
            <div style={{ marginTop: '1rem' }}>
              {canAccessContent ? (
                <a
                  href={contentUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="primary-btn"
                  style={{ display: 'inline-block' }}
                >
                  Read / Download
                </a>
              ) : (
                <div className="premium-locked">
                  <button className="primary-btn" disabled>
                    Read / Download (Premium)
                  </button>
                  <Link to="/subscription" className="primary-btn subscribe-cta">
                    Subscribe to read
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {book.summary && (
        <section className="book-detail__section">
          <h2>Summary</h2>
          <p>{book.summary}</p>
        </section>
      )}

      {contentUrl && contentUrl.endsWith('.pdf') && canAccessContent && (
        <section className="book-detail__section" style={{ marginTop: '1.5rem' }}>
          <h2>Preview</h2>
          <iframe
            src={contentUrl}
            title={`Preview of ${book.title}`}
            style={{ width: '100%', height: '500px', border: '1px solid rgba(148,163,184,0.2)', borderRadius: '0.5rem' }}
          />
        </section>
      )}

      {isPremium && !canAccessContent && (
        <section className="book-detail__section premium-locked">
          <h2>Premium content</h2>
          <p>This book is reserved for subscribers. Subscribe to unlock the full text.</p>
          <Link to="/subscription" className="primary-btn subscribe-cta">
            View premium plan
          </Link>
        </section>
      )}
    </div>
  );
}
