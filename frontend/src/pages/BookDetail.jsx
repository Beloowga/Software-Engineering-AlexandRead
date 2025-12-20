import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import api from '../services/api.js';
import Loader from '../components/Loader.jsx';
import { buildCoverUrl, buildBookContentUrl } from '../utils/storageUrls.js';
import SaveBookButton from '../components/SaveBookButton.jsx';
import CommentModal from '../components/CommentModal.jsx';
import CommentList from '../components/CommentList.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { fetchComments, fetchCommentStats, postComment, deleteCommentRequest, updateCommentRequest } from '../services/comments.js';
import {
  fetchReadingStatus,
  startReading as logStartReading,
  finishReading as logFinishReading,
} from '../services/reading.js';

export default function BookDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [comments, setComments] = useState([]);
  const [commentStats, setCommentStats] = useState({ averageRating: null, totalComments: 0 });
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [isCommentModalOpen, setIsCommentModalOpen] = useState(false);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingComment, setEditingComment] = useState(null);
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);
  const [toast, setToast] = useState({ message: '', type: 'success' });
  const [targetCommentId, setTargetCommentId] = useState(null);
  const [readingEntry, setReadingEntry] = useState(null);
  const [readingActionLoading, setReadingActionLoading] = useState(false);

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

  useEffect(() => {
    async function loadCommentsAndStats() {
      if (!book) return;
      setCommentsLoading(true);
      try {
        const [commentsData, statsData] = await Promise.all([
          fetchComments(book.id),
          fetchCommentStats(book.id),
        ]);
        setComments(commentsData.comments || []);
        setCommentStats(statsData);
      } catch (err) {
        console.error('Error loading comments:', err);
      } finally {
        setCommentsLoading(false);
      }
    }
    loadCommentsAndStats();
  }, [book]);

  useEffect(() => {
    if (!toast.message) return;
    const timer = setTimeout(() => setToast({ message: '', type: 'success' }), 3000);
    return () => clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    let ignore = false;
    async function loadReadingStatus() {
      if (!user) {
        if (!ignore) setReadingEntry(null);
        return;
      }
      try {
        const entry = await fetchReadingStatus(id);
        if (!ignore) setReadingEntry(entry);
      } catch (err) {
        console.warn('Unable to load reading status', err);
      }
    }
    loadReadingStatus();
    return () => {
      ignore = true;
    };
  }, [id, user]);

  if (loading) return <Loader />;
  if (error) return <p className="error">{error}</p>;
  if (!book) return null;

  const coverUrl = buildCoverUrl(book.cover_image);
  const contentUrl = buildBookContentUrl(book.content);
  const isPremium = Boolean(book.premium);
  
  const isSubscriber = user?.subscription?.isActive;
  const canAccessContent = !isPremium || isSubscriber;
  const isLoggedIn = Boolean(user);
  const canComment = isLoggedIn && (!isPremium || isSubscriber);
  const isReading = readingEntry && !readingEntry.is_finished && !readingEntry.end_read_date;

  const handleAddComment = () => {
    if (!isLoggedIn) {
      navigate('/auth', { state: { from: location.pathname, mode: 'signin' } });
      return;
    }
    if (!canComment) {
      alert('You need to subscribe to comment on premium books');
      return;
    }
    setIsCommentModalOpen(true);
  };

  const handleSubmitComment = async ({ rating, comment }) => {
    setIsSubmittingComment(true);
    try {
      const newComment = await postComment(book.id, rating, comment);
      setComments([newComment, ...comments]);
      
      const updatedStats = await fetchCommentStats(book.id);
      setCommentStats(updatedStats);
      
      setIsCommentModalOpen(false);
      setToast({ message: 'Comment published successfully', type: 'success' });
    } catch (err) {
      console.error('Error posting comment:', err);
      setToast({ message: 'Failed to publish comment. Please try again.', type: 'error' });
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleDeleteRequest = (commentId) => {
    setDeleteTargetId(commentId);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTargetId) return;
    setDeleteLoading(true);
    try {
      await deleteCommentRequest(deleteTargetId);
      setComments(comments.filter((c) => c.id !== deleteTargetId));
      
      const updatedStats = await fetchCommentStats(book.id);
      setCommentStats(updatedStats);
      
      setToast({ message: 'Comment deleted successfully', type: 'success' });
    } catch (err) {
      console.error('Error deleting comment:', err);
      setToast({ message: 'Failed to delete comment. Please try again.', type: 'error' });
    }
    setDeleteLoading(false);
    setDeleteConfirmOpen(false);
    setDeleteTargetId(null);
  };

  const handleEditRequest = (comment) => {
    setEditingComment(comment);
    setIsEditModalOpen(true);
  };

  const handleSubmitEdit = async ({ rating, comment }) => {
    if (!editingComment) return;
    setIsSubmittingEdit(true);
    try {
      const updated = await updateCommentRequest(editingComment.id, rating, comment);
      setComments(
        comments.map((c) =>
          c.id === editingComment.id ? { ...c, ...updated } : c
        )
      );

      const updatedStats = await fetchCommentStats(book.id);
      setCommentStats(updatedStats);

      setIsEditModalOpen(false);
      setEditingComment(null);
      setToast({ message: 'Comment updated successfully', type: 'success' });
    } catch (err) {
      console.error('Error updating comment:', err);
      setToast({ message: 'Failed to update comment. Please try again.', type: 'error' });
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  const userComment = comments.find((c) => c.user_id === user?.id);
  const readingStartLabel = readingEntry?.start_read_date
    ? new Date(readingEntry.start_read_date).toLocaleDateString()
    : null;
  const readingEndLabel = readingEntry?.end_read_date
    ? new Date(readingEntry.end_read_date).toLocaleDateString()
    : null;

  const handleLogStart = async () => {
    if (!isLoggedIn) return;
    if (isReading) return;
    setReadingActionLoading(true);
    try {
      const entry = await logStartReading(book.id);
      setReadingEntry(entry);
    } catch (err) {
      console.error('Error logging reading start:', err);
      setToast({ message: 'Could not log reading activity.', type: 'error' });
    } finally {
      setReadingActionLoading(false);
    }
  };

  const handleFinishReading = async () => {
    if (!isReading) return;
    setReadingActionLoading(true);
    try {
      const entry = await logFinishReading(book.id);
      setReadingEntry(entry);
      setToast({ message: 'Marked as finished.', type: 'success' });
    } catch (err) {
      console.error('Error finishing book:', err);
      setToast({ message: 'Could not mark book as finished.', type: 'error' });
    } finally {
      setReadingActionLoading(false);
    }
  };

  const handleCommentButton = () => {
    if (userComment) {
      setTargetCommentId(userComment.id);
      return;
    }
    handleAddComment();
  };

  const commentCtaLabel = userComment ? 'View your comment' : 'Add Comment';

  return (
    <div className="book-detail">
      {toast.message && (
        <div className="toast-container">
          <div className={`toast ${toast.type === 'error' ? 'toast--error' : 'toast--success'}`}>
            {toast.message}
          </div>
        </div>
      )}

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
            <div className="book-detail__title-meta">
              <h1>{book.title}</h1>
              {commentStats.averageRating !== null && (
                <div className="book-detail__rating-badge">
                  <span className="book-detail__rating-star">★</span>
                  <span className="book-detail__rating-score">
                    {commentStats.averageRating}/10
                  </span>
                  <span className="book-detail__rating-count">
                    ({commentStats.totalComments})
                  </span>
                </div>
              )}
            </div>
            {isPremium && <span className="premium-badge">Premium</span>}
            <SaveBookButton bookId={book.id} variant="detail" />
          </div>
          <p className="book-detail__author">{book.author}</p>
          <p className="book-detail__meta">
            {book.genre}{book.year ? ` - ${book.year}` : ''}
          </p>

          {contentUrl && (
            <div className="book-detail__cta-stack">
              {canAccessContent ? (
                <>
                  <div className="book-detail__cta-row">
                    <a
                      href={contentUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="primary-btn book-detail__download"
                      onClick={handleLogStart}
                    >
                      Read / Download
                    </a>
                    {isReading && (
                      <div className="book-detail__reading-meta">
                        <button
                          onClick={handleFinishReading}
                          className="primary-btn finish-btn"
                          disabled={readingActionLoading}
                        >
                          {readingActionLoading ? 'Saving...' : 'Mark as finished'}
                        </button>
                        {readingStartLabel && (
                          <span className="book-detail__reading-start">
                            Started on {readingStartLabel}
                          </span>
                        )}
                      </div>
                    )}
                    {!isReading && readingEndLabel && (
                      <div className="book-detail__reading-meta">
                        <span className="book-detail__reading-start">
                          Finished on {readingEndLabel}
                        </span>
                        {readingStartLabel && (
                          <span className="book-detail__reading-start book-detail__reading-start--secondary">
                            Started on {readingStartLabel}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={handleCommentButton}
                    className="primary-btn comment-btn"
                  >
                    {commentCtaLabel}
                  </button>
                </>
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

          {!contentUrl && (
            <button
              onClick={handleCommentButton}
              className="primary-btn comment-btn book-detail__comment-cta"
            >
              {commentCtaLabel}
            </button>
          )}
        </div>
      </div>

      {book.summary && (
        <section className="book-detail__section">
          <h2>Summary</h2>
          <p className="book-detail__summary">{book.summary}</p>
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

      {/* Comments Section */}
      <CommentList
        comments={comments.map((c) => ({
          ...c,
          showDelete: user?.id === c.account?.id,
        }))}
        onDelete={handleDeleteRequest}
        onEdit={handleEditRequest}
        targetCommentId={targetCommentId}
        isLoading={commentsLoading}
      />

      {/* Comment Modal */}
      <CommentModal
        isOpen={isCommentModalOpen}
        onClose={() => setIsCommentModalOpen(false)}
        onSubmit={handleSubmitComment}
        isSubmitting={isSubmittingComment}
      />

      <CommentModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingComment(null);
        }}
        onSubmit={handleSubmitEdit}
        isSubmitting={isSubmittingEdit}
        title="Edit Comment"
        submitLabel="Update"
        initialRating={editingComment?.rating || 0}
        initialComment={editingComment?.comment || ''}
      />

      {deleteConfirmOpen && (
        <div className="confirm-overlay">
          <div className="confirm-modal">
            <h3>Delete this comment?</h3>
            <p>This action cannot be undone.</p>
            <div className="confirm-modal__actions">
              <button
                type="button"
                className="ghost-btn"
                onClick={() => {
                  setDeleteConfirmOpen(false);
                  setDeleteTargetId(null);
                }}
                disabled={deleteLoading}
              >
                Cancel
              </button>
              <button
                type="button"
                className="danger-btn"
                onClick={handleConfirmDelete}
                disabled={deleteLoading}
              >
                {deleteLoading ? 'Deleting...' : 'Yes, delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
