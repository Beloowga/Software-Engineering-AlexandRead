import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import Loader from '../components/Loader.jsx';
import api from '../services/api.js';
import {
  createBook,
  updateBook,
  deleteBook,
  fetchAdminComments,
  updateAdminComment,
  deleteAdminComment,
  uploadCoverFile,
  uploadBookContent,
} from '../services/admin.js';
import { GENRE_OPTIONS } from '../constants/genres.js';
import '../styles/admin.css';

const emptyBookForm = {
  title: '',
  author: '',
  genre: '',
  year: '',
  summary: '',
  coverImage: '',
  content: '',
  premium: false,
};

export default function AdminDashboard() {
  const { user, initializing } = useAuth();
  const navigate = useNavigate();
  const isAdmin = (user?.role || '').toString().toLowerCase() === 'admin';

  const [books, setBooks] = useState([]);
  const [booksLoading, setBooksLoading] = useState(true);
  const [bookForm, setBookForm] = useState(emptyBookForm);
  const [editingBookId, setEditingBookId] = useState(null);
  const [bookStatus, setBookStatus] = useState('');
  const [bookError, setBookError] = useState('');

  const [commentFilterBook, setCommentFilterBook] = useState('');
  const [comments, setComments] = useState([]);
  const [commentLoading, setCommentLoading] = useState(false);
  const [commentError, setCommentError] = useState('');
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [commentForm, setCommentForm] = useState({ rating: '', comment: '' });
  const [commentSearch, setCommentSearch] = useState('');
  const [commentDeleteTarget, setCommentDeleteTarget] = useState(null);
  const [bookQuery, setBookQuery] = useState('');
  const [coverUploading, setCoverUploading] = useState(false);
  const [bookUploading, setBookUploading] = useState(false);
  const coverInputRef = useRef(null);
  const bookInputRef = useRef(null);
  const bookFormRef = useRef(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [genreOpen, setGenreOpen] = useState(false);
  const genreRef = useRef(null);

  useEffect(() => {
    if (initializing) return;
    if (!isAdmin) {
      navigate('/');
    }
  }, [initializing, isAdmin, navigate]);

  useEffect(() => {
    if (!isAdmin) return;
    loadBooks();
  }, [isAdmin]);

  useEffect(() => {
    if (!isAdmin) return;
    loadComments(commentFilterBook);
  }, [isAdmin, commentFilterBook]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (genreRef.current && !genreRef.current.contains(e.target)) {
        setGenreOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const bookLookup = useMemo(() => {
    return new Map((books || []).map((b) => [b.id, b]));
  }, [books]);

  const filteredBooks = useMemo(() => {
    const query = bookQuery.trim().toLowerCase();
    if (!query) return books;
    return books.filter((book) => {
      return (
        book.title.toLowerCase().includes(query) ||
        (book.author || '').toLowerCase().includes(query) ||
        (book.genre || '').toLowerCase().includes(query)
      );
    });
  }, [books, bookQuery]);

  const filteredComments = useMemo(() => {
    const q = commentSearch.trim().toLowerCase();
    if (!q) return comments;
    return comments.filter((c) => {
      const user = c.account?.name || c.account?.pseudo || c.account?.email || '';
      const bookTitle = c.book?.title || '';
      const rating = (c.rating ?? '').toString();
      return (
        user.toLowerCase().includes(q) ||
        bookTitle.toLowerCase().includes(q) ||
        rating.includes(q) ||
        (c.comment || '').toLowerCase().includes(q)
      );
    });
  }, [comments, commentSearch]);

  async function fileToDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  async function loadBooks() {
    setBooksLoading(true);
    setBookError('');
    try {
      const res = await api.get('/books');
      setBooks(res.data || []);
    } catch (err) {
      console.error('[Admin] loadBooks error', err);
      setBookError('Unable to load books. Please try again.');
    } finally {
      setBooksLoading(false);
    }
  }

  function resetBookForm() {
    setBookForm(emptyBookForm);
    setEditingBookId(null);
  }

  async function startEditBook(bookId) {
    try {
      const res = await api.get(`/books/${bookId}`);
      const book = res.data;
      setBookForm({
        title: book.title || '',
        author: book.author || '',
        genre: book.genre || '',
        year: book.year || '',
        summary: book.summary || '',
        coverImage: book.cover_image || '',
        content: book.content || '',
        premium: Boolean(book.premium),
      });
      setEditingBookId(bookId);
      setBookStatus('');
      if (bookFormRef.current) {
        bookFormRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    } catch (err) {
      console.error('[Admin] startEditBook error', err);
      setBookError('Unable to load this book.');
    }
  }

  async function handleFileUpload(event, type) {
    const file = event.target.files?.[0];
    if (!file) return;

    setBookError('');
    setBookStatus('');
    try {
      if (type === 'cover') {
        setCoverUploading(true);
      } else {
        setBookUploading(true);
      }
      const dataUrl = await fileToDataUrl(file);
      const uploadFn = type === 'cover' ? uploadCoverFile : uploadBookContent;
      const result = await uploadFn(dataUrl, file.name);
      if (type === 'cover') {
        setBookForm((prev) => ({ ...prev, coverImage: result.path || result.url || '' }));
        setBookStatus('Cover uploaded.');
      } else {
        setBookForm((prev) => ({ ...prev, content: result.path || result.url || '' }));
        setBookStatus('Content uploaded.');
      }
    } catch (err) {
      console.error('[Admin] upload error', err);
      const message = err?.response?.data?.error || 'Upload failed.';
      setBookError(message);
    } finally {
      if (type === 'cover') {
        setCoverUploading(false);
      } else {
        setBookUploading(false);
      }
      event.target.value = '';
    }
  }

  async function handleBookSubmit(event) {
    event.preventDefault();
    setBookStatus('');
    setBookError('');

    if (!bookForm.genre) {
      setBookError('Genre is required.');
      return;
    }
    if (!bookForm.summary?.trim()) {
      setBookError('Summary is required.');
      return;
    }
    if (!bookForm.coverImage) {
      setBookError('Please upload a cover image.');
      return;
    }
    if (!bookForm.content) {
      setBookError('Please upload the book content (PDF).');
      return;
    }

    const payload = {
      title: bookForm.title.trim(),
      author: bookForm.author.trim(),
      genre: bookForm.genre.trim(),
      year: bookForm.year ? Number(bookForm.year) : null,
      summary: bookForm.summary,
      coverImage: bookForm.coverImage,
      content: bookForm.content,
      premium: Boolean(bookForm.premium),
    };

    try {
      if (editingBookId) {
        await updateBook(editingBookId, payload);
        setBookStatus('Book updated.');
      } else {
        await createBook(payload);
        setBookStatus('Book added.');
      }
      resetBookForm();
      await loadBooks();
    } catch (err) {
      const message = err?.response?.data?.error || 'Unable to save book.';
      setBookError(message);
    }
  }

  async function handleDeleteBook(bookId) {
    try {
      setDeleteLoading(true);
      await deleteBook(bookId);
      await loadBooks();
      setDeleteTarget(null);
    } catch (err) {
      const message = err?.response?.data?.error || 'Unable to delete book.';
      setBookError(message);
    } finally {
      setDeleteLoading(false);
    }
  }

  async function loadComments(bookId) {
    setCommentLoading(true);
    setCommentError('');
    try {
      const params = { limit: 50 };
      if (bookId) params.bookId = bookId;
      const res = await fetchAdminComments(params);
      setComments(res.comments || []);
    } catch (err) {
      console.error('[Admin] loadComments error', err);
      setCommentError('Unable to load comments.');
    } finally {
      setCommentLoading(false);
    }
  }

  function startEditComment(comment) {
    setEditingCommentId(comment.id);
    setCommentForm({
      rating: comment.rating,
      comment: comment.comment || '',
    });
  }

  async function handleCommentUpdate(event) {
    event.preventDefault();
    if (!editingCommentId) return;
    setCommentError('');
    try {
      const payload = {
        rating: Number(commentForm.rating),
        comment: commentForm.comment,
      };
      const updated = await updateAdminComment(editingCommentId, payload);
      setComments((prev) =>
        prev.map((c) => (c.id === editingCommentId ? { ...c, ...updated } : c))
      );
      setEditingCommentId(null);
      setCommentForm({ rating: '', comment: '' });
    } catch (err) {
      const message = err?.response?.data?.error || 'Unable to update comment.';
      setCommentError(message);
    }
  }

  async function handleDeleteComment(commentId) {
    try {
      await deleteAdminComment(commentId);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
      setCommentDeleteTarget(null);
    } catch (err) {
      const message = err?.response?.data?.error || 'Unable to delete comment.';
      setCommentError(message);
    }
  }

  if (initializing || (isAdmin && booksLoading && !comments.length)) {
    return <Loader />;
  }

  if (!isAdmin) {
    return (
      <div className="admin-page">
        <h1>Admin only</h1>
        <p className="muted">You need administrator rights to view this page.</p>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <div className="admin-page__header">
        <div>
          <p className="eyebrow">Administration</p>
          <h1>Control panel</h1>
          <p className="muted">
            Manage the current library, and moderate user reviews.
          </p>
        </div>
        <div className="admin-pill">
          <span className="dot" />
          Admin mode
        </div>
      </div>

      <div className="admin-grid">
        <section className="admin-card">
          <div className="admin-card__header">
            <div>
              <p className="eyebrow">Books</p>
              <h2>{editingBookId ? 'Edit book' : 'Add a new book'}</h2>
            </div>
            {editingBookId && (
              <button className="ghost-btn" type="button" onClick={resetBookForm}>
                Cancel edit
              </button>
            )}
          </div>

          <form className="admin-form" onSubmit={handleBookSubmit} ref={bookFormRef}>
            <div className="form-row">
              <label>
                Title
                <input
                  className="admin-input admin-input--surface"
                  type="text"
                  value={bookForm.title}
                  onChange={(e) => setBookForm({ ...bookForm, title: e.target.value })}
                  required
                />
              </label>
              <label>
                Author
                <input
                  className="admin-input admin-input--surface"
                  type="text"
                  value={bookForm.author}
                  onChange={(e) => setBookForm({ ...bookForm, author: e.target.value })}
                  required
                />
              </label>
            </div>

            <div className="form-row">
              <label>
                Genre
                <div className="genre-single" ref={genreRef}>
                  <button
                    type="button"
                    className={`genre-single__control ${bookForm.genre ? 'has-value' : ''}`}
                    onClick={() => setGenreOpen((prev) => !prev)}
                    aria-haspopup="listbox"
                    aria-expanded={genreOpen}
                  >
                    <span>{bookForm.genre || 'Select a genre'}</span>
                    <span className={`genre-single__chevron ${genreOpen ? 'open' : ''}`} aria-hidden="true">v</span>
                  </button>
                  {genreOpen && (
                    <div className="genre-single__dropdown" role="listbox">
                      {GENRE_OPTIONS.map((genre) => (
                        <button
                          key={genre}
                          type="button"
                          className={`genre-single__option ${bookForm.genre === genre ? 'is-selected' : ''}`}
                            onClick={() => {
                              setBookForm((prev) => ({ ...prev, genre }));
                              setGenreOpen(false);
                            }}
                            required
                          >
                            {genre}
                          </button>
                      ))}
                    </div>
                  )}
                </div>
              </label>
              <label>
                Year
                <input
                  className="admin-input admin-input--surface"
                  type="number"
                  value={bookForm.year}
                  onChange={(e) => setBookForm({ ...bookForm, year: e.target.value })}
                  required
                />
              </label>
              <label className="switch-field">
                <span className="switch-label">Premium book</span>
                <label className="switch">
                  <input
                    type="checkbox"
                    checked={bookForm.premium}
                    onChange={(e) => setBookForm({ ...bookForm, premium: e.target.checked })}
                  />
                  <span className="slider" />
                </label>
              </label>
            </div>

            <label>
              Summary
              <textarea
                className="admin-input"
                rows="3"
                value={bookForm.summary}
                onChange={(e) => setBookForm({ ...bookForm, summary: e.target.value })}
                required
              />
            </label>

            <div className="form-row">
              <label className="file-label">
                Cover image
                <div className="file-field">
                  <span className="file-chip">
                    {bookForm.coverImage ? bookForm.coverImage : 'No cover uploaded'}
                  </span>
                  <div className="inline-actions">
                    <button
                      type="button"
                      className="ghost-btn"
                      onClick={() => coverInputRef.current?.click()}
                      disabled={coverUploading}
                    >
                      {coverUploading ? 'Uploading...' : 'Upload cover'}
                    </button>
                    {bookForm.coverImage && (
                      <button
                        type="button"
                        className="ghost-btn"
                        onClick={() => setBookForm((prev) => ({ ...prev, coverImage: '' }))}
                      >
                        Clear
                      </button>
                    )}
                    <input
                      ref={coverInputRef}
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={(e) => handleFileUpload(e, 'cover')}
                    />
                  </div>
                </div>
              </label>
              <label className="file-label">
                Content file
                <div className="file-field">
                  <span className="file-chip">
                    {bookForm.content ? bookForm.content : 'No file uploaded'}
                  </span>
                  <div className="inline-actions">
                    <button
                      type="button"
                      className="ghost-btn"
                      onClick={() => bookInputRef.current?.click()}
                      disabled={bookUploading}
                    >
                      {bookUploading ? 'Uploading...' : 'Upload file'}
                    </button>
                    {bookForm.content && (
                      <button
                        type="button"
                        className="ghost-btn"
                        onClick={() => setBookForm((prev) => ({ ...prev, content: '' }))}
                      >
                        Clear
                      </button>
                    )}
                    <input
                      ref={bookInputRef}
                      className="admin-input"
                      type="file"
                      accept=".pdf,application/pdf"
                      style={{ display: 'none' }}
                      onChange={(e) => handleFileUpload(e, 'book')}
                    />
                  </div>
                </div>
              </label>
            </div>

            <div className="form-actions">
              <button type="submit" className="primary-btn">
                {editingBookId ? 'Update book' : 'Add book'}
              </button>
              {bookStatus && <span className="status success">{bookStatus}</span>}
              {bookError && <span className="status error">{bookError}</span>}
            </div>
          </form>

          <div className="admin-list">
            <div className="admin-list__header">
              <div>
                <h3>Current catalog</h3>
                <p className="muted" style={{ marginTop: '0.2rem' }}>Search by title, author or genre.</p>
              </div>
              <div className="admin-list__tools">
                <input
                  type="text"
                  placeholder="Filter library..."
                  value={bookQuery}
                  onChange={(e) => setBookQuery(e.target.value)}
                />
                <span className="badge">{filteredBooks.length} / {books.length} books</span>
              </div>
            </div>
            {booksLoading ? (
              <p className="muted">Loading books...</p>
            ) : filteredBooks.length === 0 ? (
              <p className="muted">No books match this search.</p>
            ) : (
              <div className="admin-book-list">
                {filteredBooks.map((book) => (
                  <div key={book.id} className="admin-book-card">
                    <div>
                      <p className="eyebrow">{book.genre || 'Unknown genre'}</p>
                      <h4>{book.title}</h4>
                      <p className="muted">{book.author} {book.year ? `• ${book.year}` : ''}</p>
                    </div>
                    <div className="admin-book-actions">
                      {book.premium && <span className="badge">Premium</span>}
                      <button className="ghost-btn" type="button" onClick={() => startEditBook(book.id)}>
                        Edit
                      </button>
                      <button
                        className="ghost-btn danger-outline"
                        type="button"
                        onClick={() => setDeleteTarget(book)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="admin-card">
          <div className="admin-card__header">
            <div>
              <p className="eyebrow">Users</p>
              <h2>Moderate comments & ratings</h2>
            </div>
          </div>

          <div className="form-row">
            <label style={{ flex: 1 }}>
              Search comments
              <input
                type="text"
                className="filter-input filter-input--surface"
                placeholder="Search by user, book or text..."
                value={commentSearch}
                onChange={(e) => setCommentSearch(e.target.value)}
              />
            </label>
            <div className="admin-card__summary">
              <span className="badge">{filteredComments.length} / {comments.length} comments</span>
            </div>
          </div>

          {commentLoading ? (
            <p className="muted">Loading comments...</p>
          ) : comments.length === 0 ? (
            <p className="muted">No comments for this filter.</p>
          ) : (
            <div className="comment-moderation">
              {filteredComments.map((comment) => (
                <div key={comment.id} className="comment-moderation__item">
                  <div className="comment-moderation__meta">
                    <div>
                      <p className="eyebrow">{comment.book?.title || 'Unknown book'}</p>
                      <h4>{comment.account?.name || comment.account?.pseudo || comment.account?.email || 'User'}</h4>
                      <p className="muted">{new Date(comment.created_at).toLocaleString()}</p>
                    </div>
                    <div className="comment-moderation__rating">
                      <span className="rating-chip">{comment.rating}/10</span>
                    </div>
                  </div>

                  <p className="muted">{comment.comment || 'No comment text'}</p>

                  <div className="comment-moderation__actions">
                    <button type="button" className="ghost-btn" onClick={() => startEditComment(comment)}>
                      Edit rating/comment
                    </button>
                    <button type="button" className="danger-btn" onClick={() => setCommentDeleteTarget(comment)}>
                      Delete
                    </button>
                  </div>

                  {editingCommentId === comment.id && (
                    <form className="comment-edit-form" onSubmit={handleCommentUpdate}>
                      <div className="comment-edit-grid">
                        <div>
                          <label className="comment-edit-label">
                            Rating (1-10)
                            <input
                              type="number"
                              min="1"
                              max="10"
                              className="admin-input"
                              value={commentForm.rating}
                              onChange={(e) => setCommentForm({ ...commentForm, rating: e.target.value })}
                              required
                            />
                          </label>
                        </div>
                        <div>
                          <label className="comment-edit-label">
                            Comment
                            <textarea
                              rows="3"
                              className="admin-input"
                              value={commentForm.comment}
                              onChange={(e) => setCommentForm({ ...commentForm, comment: e.target.value })}
                              placeholder="Add moderator note or edit user text"
                            />
                          </label>
                        </div>
                      </div>
                      <div className="form-actions">
                        <button type="submit" className="primary-btn">Save changes</button>
                        <button
                          type="button"
                          className="ghost-btn"
                          onClick={() => {
                            setEditingCommentId(null);
                            setCommentForm({ rating: '', comment: '' });
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              ))}
            </div>
          )}
          {commentError && <span className="status error">{commentError}</span>}
        </section>
      </div>

      {commentDeleteTarget && (
        <div className="admin-modal__overlay">
          <div className="admin-modal">
            <h3>Delete this comment?</h3>
            <p className="muted">
              From {commentDeleteTarget.account?.name || commentDeleteTarget.account?.email || 'user'} on "{commentDeleteTarget.book?.title || 'this book'}".
            </p>
            <div className="admin-modal__actions">
              <button
                type="button"
                className="ghost-btn modal-cancel"
                onClick={() => setCommentDeleteTarget(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="danger-btn"
                onClick={() => handleDeleteComment(commentDeleteTarget.id)}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="admin-modal__overlay">
          <div className="admin-modal">
            <h3>Delete this book?</h3>
            <p className="muted">
              "{deleteTarget.title}" will be permanently removed from the library.
            </p>
            <div className="admin-modal__actions">
              <button
                type="button"
                className="ghost-btn modal-cancel"
                onClick={() => setDeleteTarget(null)}
                disabled={deleteLoading}
              >
                Cancel
              </button>
              <button
                type="button"
                className="danger-btn"
                onClick={() => handleDeleteBook(deleteTarget.id)}
                disabled={deleteLoading}
              >
                {deleteLoading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
