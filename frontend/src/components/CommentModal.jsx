import { useEffect, useState } from 'react';
import '../styles/components/CommentModal.css';

export default function CommentModal({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
  title = 'Add a Comment',
  submitLabel = 'Publish',
  initialRating = 0,
  initialComment = '',
}) {
  const [rating, setRating] = useState(initialRating);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState(initialComment);

  useEffect(() => {
    if (isOpen) {
      setRating(initialRating);
      setComment(initialComment);
    }
  }, [isOpen, initialRating, initialComment]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (rating === 0) {
      alert('Please select a rating');
      return;
    }

    try {
      await onSubmit({ rating, comment });
      setRating(initialRating);
      setComment(initialComment);
    } catch (err) {
      console.error('Error submitting comment:', err);
    }
  };

  const handleReset = () => {
    setRating(initialRating);
    setComment(initialComment);
  };

  if (!isOpen) return null;

  const charCount = comment.length;
  const maxChars = 500;

  return (
    <div className="comment-modal-overlay" onClick={onClose}>
      <div className="comment-modal" onClick={(e) => e.stopPropagation()}>
        <div className="comment-modal__header">
          <h2>{title}</h2>
          <button
            className="comment-modal__close"
            onClick={onClose}
            aria-label="Close modal"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="comment-modal__form">
          <div className="comment-modal__rating-section">
            <label>Your Rating</label>
            <div className="comment-modal__stars">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((star) => (
                <button
                  key={star}
                  type="button"
                  className={`comment-modal__star ${star <= (hoveredRating || rating) ? 'active' : ''}`}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  aria-label={`Rate ${star} stars`}
                >
                  ★
                </button>
              ))}
            </div>
            {rating > 0 && (
              <p className="comment-modal__rating-display">{rating}/10</p>
            )}
          </div>

          <div className="comment-modal__textarea-section">
            <label htmlFor="comment">Comment (Optional)</label>
            <textarea
              id="comment"
              value={comment}
              onChange={(e) => {
                if (e.target.value.length <= maxChars) {
                  setComment(e.target.value);
                }
              }}
              placeholder="Share your thoughts about this book..."
              maxLength={maxChars}
              className="comment-modal__textarea"
            />
            <p className="comment-modal__char-count">
              {charCount}/{maxChars}
            </p>
          </div>

          <div className="comment-modal__actions">
            <button
              type="button"
              onClick={handleReset}
              className="comment-modal__btn comment-modal__btn--delete"
              disabled={isSubmitting}
            >
              Clear
            </button>
            <button
              type="submit"
              className="comment-modal__btn comment-modal__btn--submit"
              disabled={isSubmitting || rating === 0}
            >
              {isSubmitting ? `${submitLabel}...` : submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
