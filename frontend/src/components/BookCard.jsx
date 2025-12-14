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
        {premium && <span className="premium-badge">Premium</span>}
        <div className="book-card__actions">
          {stats.averageRating !== null && (
            <div className="book-card__rating">
              <span className="book-card__rating-star">★</span>
              <span className="book-card__rating-value">{stats.averageRating}</span>
            </div>
          )}
          <SaveBookButton bookId={id} variant="card" />
        </div>
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
