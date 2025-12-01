import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { buildCoverUrl } from '../utils/storageUrls.js';
import SaveBookButton from './SaveBookButton.jsx';
import { fetchCommentStats } from '../services/comments.js';

export default function BookCard({ book }) {
  const {
    id,
    title,
    author,
    genre,
    year,
    summary,
    cover_image,
    premium,
  } = book;

  const [stats, setStats] = useState({ averageRating: null, totalComments: 0 });

  useEffect(() => {
    async function loadStats() {
      try {
        const data = await fetchCommentStats(id);
        setStats(data);
      } catch (err) {
        console.error('Error loading book stats:', err);
      }
    }
    loadStats();
  }, [id]);

  const imgUrl = buildCoverUrl(cover_image);

  return (
    <article className="book-card">
      <div className="book-card__image">
        <SaveBookButton bookId={id} variant="card" />
        {premium && <span className="premium-badge">Premium</span>}
        {stats.averageRating !== null && (
          <div style={{
            position: 'absolute',
            top: '0.75rem',
            right: '2.75rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.25rem',
            padding: '0.4rem 0.6rem',
            backgroundColor: '#fef3c7',
            borderRadius: '0.35rem',
            fontSize: '0.8rem',
            fontWeight: '600',
            color: '#1e293b',
            zIndex: 5
          }}>
            <span style={{ color: '#f59e0b' }}>★</span>
            <span>{stats.averageRating}</span>
          </div>
        )}
        {imgUrl ? (
          <img
            src={imgUrl}
            alt={title}
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.parentNode.innerHTML = '<div class="book-card__placeholder">No cover</div>';
            }}
          />
        ) : (
          <div className="book-card__placeholder">No cover</div>
        )}
      </div>
      <div className="book-card__body">
        <h2 className="book-card__title">{title}</h2>
        <p className="book-card__author">{author}</p>
        <p className="book-card__meta">
          {genre}{year ? ` - ${year}` : ''}
        </p>
        {summary && (
          <p className="book-card__summary">
            {summary.length > 100 ? `${summary.slice(0, 100)}...` : summary}
          </p>
        )}
        <Link className="book-card__link" to={`/books/${id}`}>
          View book
        </Link>
      </div>
    </article>
  );
}
