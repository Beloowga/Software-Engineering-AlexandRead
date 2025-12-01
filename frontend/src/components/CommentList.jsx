import { useState, useEffect } from 'react';
import { buildCoverUrl } from '../utils/storageUrls.js';
import './CommentList.css';

export default function CommentList({ comments, onDelete, isLoading }) {
  const [displayedComments, setDisplayedComments] = useState(comments.slice(0, 3));
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    if (showAll) {
      setDisplayedComments(comments);
    } else {
      setDisplayedComments(comments.slice(0, 3));
    }
  }, [comments, showAll]);

  if (isLoading) {
    return <div className="comment-list__loading">Loading comments...</div>;
  }

  if (!comments || comments.length === 0) {
    return <p className="comment-list__empty">No comments yet. Be the first to comment!</p>;
  }

  return (
    <section className="comment-list">
      <h2>Comments</h2>
      
      <div className="comment-list__items">
        {displayedComments.map((comment) => (
          <div key={comment.id} className="comment-item">
            <div className="comment-item__header">
              <div className="comment-item__user-info">
                {comment.account?.avatar_url ? (
                  <img
                    src={comment.account.avatar_url}
                    alt={comment.account?.name || 'User'}
                    className="comment-item__avatar"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                ) : null}
                <div
                  className="comment-item__avatar-placeholder"
                  style={{
                    display: comment.account?.avatar_url ? 'none' : 'flex',
                  }}
                >
                  {comment.account?.name?.[0]?.toUpperCase() || '?'}
                </div>
                <div className="comment-item__user-details">
                  <p className="comment-item__name">{comment.account?.name || 'Anonymous'}</p>
                  <p className="comment-item__date">
                    {new Date(comment.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {comment.showDelete && (
                <button
                  className="comment-item__delete-btn"
                  onClick={() => onDelete(comment.id)}
                  aria-label="Delete comment"
                  title="Delete comment"
                >
                  ✕
                </button>
              )}
            </div>

            <div className="comment-item__rating">
              <div className="comment-item__stars">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((star) => (
                  <span
                    key={star}
                    className={`comment-item__star ${star <= comment.rating ? 'active' : ''}`}
                  >
                    ★
                  </span>
                ))}
              </div>
              <span className="comment-item__rating-text">{comment.rating}/10</span>
            </div>

            {comment.comment && (
              <p className="comment-item__text">{comment.comment}</p>
            )}

            <div className="comment-item__separator" />
          </div>
        ))}
      </div>

      {comments.length > 3 && !showAll && (
        <button
          className="comment-list__load-more"
          onClick={() => setShowAll(true)}
        >
          Read more ({comments.length - 3} more comments)
        </button>
      )}

      {showAll && comments.length > 3 && (
        <button
          className="comment-list__load-more"
          onClick={() => setShowAll(false)}
        >
          Show less
        </button>
      )}
    </section>
  );
}
