import { useState, useEffect } from 'react';
import { buildCoverUrl } from '../utils/storageUrls.js';
import './CommentList.css';

export default function CommentList({ comments, onDelete, onEdit, isLoading, targetCommentId = null }) {
  const [displayedComments, setDisplayedComments] = useState(comments.slice(0, 3));
  const [showAll, setShowAll] = useState(false);
  const [scrollTargetId, setScrollTargetId] = useState(null);

  useEffect(() => {
    if (showAll) {
      setDisplayedComments(comments);
    } else {
      setDisplayedComments(comments.slice(0, 3));
    }
  }, [comments, showAll]);

  useEffect(() => {
    if (targetCommentId) {
      setShowAll(true);
      setScrollTargetId(targetCommentId);
    }
  }, [targetCommentId]);

  useEffect(() => {
    if (!scrollTargetId) return;
    const el = document.getElementById(`comment-${scrollTargetId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setScrollTargetId(null);
    }
  }, [displayedComments, scrollTargetId]);

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
          <div key={comment.id} id={`comment-${comment.id}`} className="comment-item">
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
                <div className="comment-item__actions">
                  <button
                    className="comment-item__action comment-item__action--edit"
                    onClick={() => onEdit?.(comment)}
                    aria-label="Edit comment"
                    title="Edit comment"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M15.232 5.232a2.5 2.5 0 0 1 3.536 3.536l-9 9L6 19l1.232-3.768z" />
                    </svg>
                  </button>
                  <button
                    className="comment-item__action comment-item__action--delete"
                    onClick={() => onDelete(comment.id)}
                    aria-label="Delete comment"
                    title="Delete comment"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 6h18" />
                      <path d="M8 6V4h8v2" />
                      <path d="M19 6v14H5V6" />
                      <path d="M10 11v6" />
                      <path d="M14 11v6" />
                    </svg>
                  </button>
                </div>
              )}
            </div>

            <div className="comment-item__rating">
              <div className="comment-item__stars">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((star) => (
                  <span
                    key={star}
                    className={`comment-item__star ${star <= comment.rating ? 'active' : ''}`}
                    aria-hidden="true"
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
