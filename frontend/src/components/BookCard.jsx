import { Link } from 'react-router-dom';
import { buildCoverUrl } from '../utils/storageUrls.js';
import SaveBookButton from './SaveBookButton.jsx';

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

  const imgUrl = buildCoverUrl(cover_image);

  return (
    <article className="book-card">
      <div className="book-card__image">
        <SaveBookButton bookId={id} variant="card" />
        {premium && <span className="premium-badge">Premium</span>}
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
