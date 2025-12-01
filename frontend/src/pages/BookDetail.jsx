import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api.js';
import Loader from '../components/Loader.jsx';
import { buildCoverUrl, buildBookContentUrl } from '../utils/storageUrls.js';
import SaveBookButton from '../components/SaveBookButton.jsx';
import CommentModal from '../components/CommentModal.jsx';
import CommentList from '../components/CommentList.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { fetchComments, fetchCommentStats, postComment, deleteCommentRequest } from '../services/comments.js';

export default function BookDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [comments, setComments] = useState([]);
  const [commentStats, setCommentStats] = useState({ averageRating: null, totalComments: 0 });
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [isCommentModalOpen, setIsCommentModalOpen] = useState(false);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

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

  // Load comments and stats
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

  if (loading) return <Loader />;
  if (error) return <p className="error">{error}</p>;
  if (!book) return null;

  const coverUrl = buildCoverUrl(book.cover_image);
  const contentUrl = buildBookContentUrl(book.content);
  const isPremium = Boolean(book.premium);
  
  // Check if user has active subscription
  const isSubscriber = user?.subscription?.isActive;
  const canAccessContent = !isPremium || isSubscriber;
  const isLoggedIn = Boolean(user);
  const canComment = isLoggedIn && (!isPremium || isSubscriber);

  const handleAddComment = () => {
    if (!isLoggedIn) {
      alert('Please log in to comment on this book');
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
      
      // Refresh stats
      const updatedStats = await fetchCommentStats(book.id);
      setCommentStats(updatedStats);
      
      setIsCommentModalOpen(false);
      alert('Comment published successfully!');
    } catch (err) {
      console.error('Error posting comment:', err);
      alert('Failed to publish comment. Please try again.');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!confirm('Are you sure you want to delete this comment?')) {
      return;
    }
    try {
      await deleteCommentRequest(commentId);
      setComments(comments.filter((c) => c.id !== commentId));
      
      // Refresh stats
      const updatedStats = await fetchCommentStats(book.id);
      setCommentStats(updatedStats);
      
      alert('Comment deleted successfully');
    } catch (err) {
      console.error('Error deleting comment:', err);
      alert('Failed to delete comment. Please try again.');
    }
  };

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
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <h1>{book.title}</h1>
              {commentStats.averageRating !== null && (
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.5rem',
                  padding: '0.5rem 1rem',
                  backgroundColor: '#fef3c7',
                  borderRadius: '0.5rem',
                  whiteSpace: 'nowrap'
                }}>
                  <span style={{ fontSize: '1.25rem', color: '#f59e0b' }}>★</span>
                  <span style={{ fontWeight: '600', color: '#1e293b' }}>
                    {commentStats.averageRating}/10
                  </span>
                  <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
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
            <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', alignItems: 'flex-start' }}>
              {canAccessContent ? (
                <>
                  <a
                    href={contentUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="primary-btn"
                    style={{ display: 'inline-block' }}
                  >
                    Read / Download
                  </a>
                  <button
                    onClick={handleAddComment}
                    className="primary-btn"
                    style={{ backgroundColor: '#10b981' }}
                  >
                    Add Comment
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
              onClick={handleAddComment}
              className="primary-btn"
              style={{ marginTop: '1rem', backgroundColor: '#10b981' }}
            >
              Add Comment
            </button>
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

      {/* Comments Section */}
      <CommentList
        comments={comments.map((c) => ({
          ...c,
          showDelete: user?.id === c.account?.id,
        }))}
        onDelete={handleDeleteComment}
        isLoading={commentsLoading}
      />

      {/* Comment Modal */}
      <CommentModal
        isOpen={isCommentModalOpen}
        onClose={() => setIsCommentModalOpen(false)}
        onSubmit={handleSubmitComment}
        isSubmitting={isSubmittingComment}
      />
    </div>
  );
}
