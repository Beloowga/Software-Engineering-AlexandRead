import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Loader from '../components/Loader.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import api from '../services/api.js';
import { fetchCurrentReading, fetchReadingHistory } from '../services/reading.js';

function formatDate(value) {
  if (!value) return '-';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString();
}

export default function ActivityPage() {
  const {
    user,
    savedBooks,
    isAuthenticated,
    initializing,
  } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [libraryBooks, setLibraryBooks] = useState([]);
  const [libraryLoading, setLibraryLoading] = useState(false);
  const [libraryError, setLibraryError] = useState('');

  const [readingEntries, setReadingEntries] = useState([]);
  const [readingLoading, setReadingLoading] = useState(false);
  const [readingError, setReadingError] = useState('');

  const [readingHistory, setReadingHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState('');

  useEffect(() => {
    if (!initializing && !isAuthenticated) {
      navigate('/auth', {
        replace: true,
        state: { from: location.pathname, mode: 'signin' },
      });
    }
  }, [initializing, isAuthenticated, navigate, location.pathname]);

  useEffect(() => {
    let ignore = false;
    async function loadLibrary() {
      if (!savedBooks?.length) {
        setLibraryBooks([]);
        setLibraryError('');
        return;
      }
      setLibraryLoading(true);
      setLibraryError('');
      try {
        const responses = await Promise.all(
          savedBooks.map((bookId) =>
            api.get(`/books/${bookId}`).then((res) => res.data).catch(() => null),
          ),
        );
        if (!ignore) {
          setLibraryBooks(responses.filter(Boolean));
        }
      } catch (err) {
        if (!ignore) {
          setLibraryError('Unable to load your saved books.');
        }
      } finally {
        if (!ignore) {
          setLibraryLoading(false);
        }
      }
    }
    loadLibrary();
    return () => {
      ignore = true;
    };
  }, [savedBooks]);

  useEffect(() => {
    let ignore = false;
    async function loadReading() {
      if (!user) {
        if (!ignore) {
          setReadingEntries([]);
          setReadingError('');
        }
        return;
      }
      setReadingLoading(true);
      setReadingError('');
      try {
        const entries = await fetchCurrentReading();
        if (!ignore) {
          setReadingEntries(entries);
        }
      } catch (err) {
        if (!ignore) {
          setReadingError('Unable to load your current reads.');
        }
      } finally {
        if (!ignore) {
          setReadingLoading(false);
        }
      }
    }
    loadReading();
    return () => {
      ignore = true;
    };
  }, [user]);

  useEffect(() => {
    let ignore = false;
    async function loadHistory() {
      if (!user) {
        if (!ignore) {
          setReadingHistory([]);
          setHistoryError('');
        }
        return;
      }
      setHistoryLoading(true);
      setHistoryError('');
      try {
        const entries = await fetchReadingHistory();
        if (!ignore) {
          setReadingHistory(entries);
        }
      } catch (err) {
        if (!ignore) {
          setHistoryError('Unable to load your reading history.');
        }
      } finally {
        if (!ignore) {
          setHistoryLoading(false);
        }
      }
    }
    loadHistory();
    return () => {
      ignore = true;
    };
  }, [user]);

  if (initializing) {
    return <Loader />;
  }

  if (!user) {
    return null;
  }

  return (
    <section className="account-page activity-page">
      <div className="account-background" />
      <div className="account-layout">
        <div className="account-actions activity-actions">
          <h1 className="page-title" style={{ margin: 0 }}>My activity</h1>
          <Link to="/" className="back-link muted-link activity-back-link">Back to previous page</Link>
        </div>

        <div className="account-grid">
          <div className="account-card reading-card">
            <div className="library-head">
              <h2>
                Currently reading
                {readingEntries.length ? ` (${readingEntries.length})` : ''}
              </h2>
              <p>Books you have started and can finish later.</p>
            </div>
            {readingLoading ? (
              <p>Loading your reading activity...</p>
            ) : readingError ? (
              <p className="status error">{readingError}</p>
            ) : readingEntries.length === 0 ? (
              <p className="status">Start reading a book to see it here.</p>
            ) : (
              <div className="library-tiles reading-tiles">
                {readingEntries.map((entry) => {
                  const book = entry.book || {};
                  const targetId = book.id || entry.book_id;
                  if (!targetId) return null;
                  const key = `${entry.book_id}-${entry.start_read_date || 'start'}`;
                  return (
                    <Link
                      key={key}
                      to={`/books/${targetId}`}
                      className="library-book reading-book"
                    >
                      <span className="library-book__title">{book.title || 'Unknown title'}</span>
                      <span className="library-book__author">
                        {book.author || 'Unknown author'}
                      </span>
                      <span className="reading-meta">
                        Started {formatDate(entry.start_read_date)}
                      </span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          <div className="account-card read-card">
            <div className="library-head">
              <h2>
                Saved books for later
                {libraryBooks.length ? ` (${libraryBooks.length})` : ''}
              </h2>
              <p>{libraryBooks.length === 0 ? 'Save books to build your collection.' : 'The books you love at a glance.'}</p>
            </div>
            {libraryLoading ? (
              <p>Loading your saved books...</p>
            ) : libraryError ? (
              <p className="status error">{libraryError}</p>
            ) : libraryBooks.length === 0 ? (
              <div className="library-tiles">
                {[0, 1, 2].map((item) => (
                  <div key={item} className="library-placeholder" />
                ))}
              </div>
            ) : (
              <div className="library-tiles">
                {libraryBooks.map((book) => (
                  <Link key={book.id} to={`/books/${book.id}`} className="library-book">
                    <span className="library-book__title">{book.title}</span>
                    <span className="library-book__author">{book.author}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div className="account-card library-card">
            <div className="library-head">
              <h2>
                Finished books
                {readingHistory.length ? ` (${readingHistory.length})` : ''}
              </h2>
              <p>{readingHistory.length === 0 ? 'Finish a book to build your history.' : 'Books you have already completed.'}</p>
            </div>
            {historyLoading ? (
              <p>Loading your read books...</p>
            ) : historyError ? (
              <p className="status error">{historyError}</p>
            ) : readingHistory.length === 0 ? (
              <div className="library-tiles">
                {[0, 1, 2].map((item) => (
                  <div key={item} className="library-placeholder" />
                ))}
              </div>
            ) : (
              <div className="library-tiles">
                {readingHistory.map((entry) => {
                  const book = entry.book || {};
                  const targetId = book.id || entry.book_id;
                  if (!targetId) return null;
                  const key = `${entry.book_id}-${entry.end_read_date || entry.start_read_date || 'history'}`;
                  return (
                    <Link key={key} to={`/books/${targetId}`} className="library-book">
                      <span className="library-book__title">{book.title || 'Unknown title'}</span>
                      <span className="library-book__author">{book.author || 'Unknown author'}</span>
                      {entry.end_read_date && (
                        <span className="reading-meta">
                          Finished {formatDate(entry.end_read_date)}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
