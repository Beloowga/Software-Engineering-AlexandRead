import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import Loader from '../components/Loader.jsx';
import { isValidEmail, getPasswordStrength } from '../utils/validators.js';
import api from '../services/api.js';
import GenreMultiSelect from '../components/GenreMultiSelect.jsx';
import { fetchCurrentReading } from '../services/reading.js';

function buildForm(profile) {
  if (!profile) {
    return {
      email: '',
      pseudo: '',
      name: '',
      dateOfBirth: '',
      region: '',
      favouriteBook: '',
      favouriteAuthor: '',
      favouriteGenres: [],
      password: '',
    };
  }
  return {
    email: profile.email || '',
    pseudo: profile.pseudo || '',
    name: profile.name || '',
    dateOfBirth: profile.dateOfBirth || '',
    region: profile.region || '',
    favouriteBook: profile.favouriteBook || '',
    favouriteAuthor: profile.favouriteAuthor || '',
    favouriteGenres: Array.isArray(profile.favouriteGenres) ? profile.favouriteGenres : [],
    password: '',
  };
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function AccountPage() {
  const {
    user,
    isAuthenticated,
    initializing,
    updateProfile,
    uploadAvatar,
    deleteAccount,
    savedBooks,
  } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState(buildForm(user));
  const [status, setStatus] = useState({ message: '', error: '' });
  const [saving, setSaving] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(user?.avatarUrl || '');
  const [deleting, setDeleting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [libraryBooks, setLibraryBooks] = useState([]);
  const [libraryLoading, setLibraryLoading] = useState(false);
  const [libraryError, setLibraryError] = useState('');
  const [readingEntries, setReadingEntries] = useState([]);
  const [readingLoading, setReadingLoading] = useState(false);
  const [readingError, setReadingError] = useState('');

  const emailValid = useMemo(() => isValidEmail(form.email), [form.email]);
  const passwordStrength = useMemo(
    () => getPasswordStrength(form.password),
    [form.password],
  );

  useEffect(() => {
    if (!initializing && !isAuthenticated) {
      navigate('/auth', {
        replace: true,
        state: { from: location.pathname, mode: 'signin' },
      });
    }
  }, [initializing, isAuthenticated, navigate, location.pathname]);

  useEffect(() => {
    setForm(buildForm(user));
    setAvatarPreview(user?.avatarUrl || '');
  }, [user]);

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

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleGenresChange = (selectedGenres) => {
    setForm((prev) => ({ ...prev, favouriteGenres: selectedGenres }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setStatus({ message: '', error: '' });
    if (!emailValid) {
      setStatus({ message: '', error: 'Please provide a valid email address.' });
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
      };
      if (!form.password.trim()) {
        delete payload.password;
      }
      const updated = await updateProfile(payload);
      setForm(buildForm(updated));
      setStatus({ message: 'Profile updated successfully!', error: '' });
    } catch (err) {
      const message = err?.response?.data?.error || err.message || 'Unable to save your profile.';
      setStatus({ message: '', error: message });
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setStatus({ message: '', error: 'Please upload an image file.' });
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      setStatus({ message: '', error: 'Profile pictures must be smaller than 3 MB.' });
      return;
    }

    try {
      setAvatarUploading(true);
      const dataUrl = await fileToDataUrl(file);
      setAvatarPreview(dataUrl);
      const updated = await uploadAvatar(dataUrl);
      setAvatarPreview(updated.avatarUrl || dataUrl);
      setStatus({ message: 'Avatar updated!', error: '' });
    } catch (err) {
      const message = err?.response?.data?.error || err.message || 'Unable to upload avatar.';
      setStatus({ message: '', error: message });
    } finally {
      setAvatarUploading(false);
      event.target.value = '';
    }
  };

  if (initializing) {
    return <Loader />;
  }

  if (!user) {
    return null;
  }

  const displayName = user.pseudo || user.name || user.email;

  const formatDate = (value) => {
    if (!value) return '—';
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return value;
    return parsed.toLocaleDateString();
  };

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

  const handleDeleteAccount = async () => {
    setStatus({ message: '', error: '' });
    setDeleting(true);
    try {
      await deleteAccount();
      setConfirmOpen(false);
      navigate('/', { replace: true });
    } catch (err) {
      const message = err?.response?.data?.error || err.message || 'Unable to delete your account.';
      setStatus({ message: '', error: message });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <section className="account-page">
      <div className="account-background" />
      <div className="account-layout">
        <div className="account-actions">
          <Link to="/" className="back-link muted-link">Back to home page</Link>
        </div>

        <form className="account-grid" onSubmit={handleSubmit}>
          <div className="account-card profile-card">
            <div className="profile-avatar">
              {avatarPreview ? (
                <img src={avatarPreview} alt="Profile avatar" className="profile-avatar__img" />
              ) : (
                <div className="profile-avatar__circle">
                  <span role="img" aria-hidden="true">BK</span>
                </div>
              )}
              <span className="profile-pseudo">
                {displayName}
                {user?.subscription?.isActive && <span className="subscription-badge">Premium</span>}
              </span>
              <label className={`upload-btn ${avatarUploading ? 'disabled' : ''}`}>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  disabled={avatarUploading}
                />
                {avatarUploading ? 'Uploading...' : 'Change photo'}
              </label>
              <div className="form-row profile-input">
                <label htmlFor="pseudo">Pseudo</label>
                <input
                  id="pseudo"
                  name="pseudo"
                  type="text"
                  value={form.pseudo}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>
          </div>

          <div className="account-card details-card">
            <h2>Profile</h2>
            <div className="profile-info-grid">
              <div className="form-row">
                <label htmlFor="email">Email</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleInputChange}
                  className={!emailValid ? 'invalid' : ''}
                  required
                />
                {!emailValid && (
                  <p className="input-hint error">Please enter a valid email.</p>
                )}
              </div>
              <div className="form-row">
                <label htmlFor="name">Name</label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  value={form.name}
                  onChange={handleInputChange}
                />
              </div>
            </div>
            <div className="profile-info-grid">
              <div className="form-row">
                <label htmlFor="dateOfBirth">Date of Birth</label>
                <input
                  id="dateOfBirth"
                  name="dateOfBirth"
                  type="date"
                  value={form.dateOfBirth}
                  onChange={handleInputChange}
                />
              </div>
              <div className="form-row">
                <label htmlFor="region">Region</label>
                <input
                  id="region"
                  name="region"
                  type="text"
                  value={form.region}
                  onChange={handleInputChange}
                />
              </div>
            </div>
          </div>

          <div className="account-card favourites-card">
            <h2>Favourites</h2>
            <div className="favorites-grid">
              <div className="form-row">
                <label htmlFor="favouriteBook">Favourite book</label>
                <input
                  id="favouriteBook"
                  name="favouriteBook"
                  type="text"
                  value={form.favouriteBook}
                  onChange={handleInputChange}
                />
              </div>
              <div className="form-row">
                <label htmlFor="favouriteAuthor">Favourite author</label>
                <input
                  id="favouriteAuthor"
                  name="favouriteAuthor"
                  type="text"
                  value={form.favouriteAuthor}
                  onChange={handleInputChange}
                />
              </div>
            </div>
            <div className="form-row wide">
              <label htmlFor="favouriteGenres">Favourite genres</label>
              <GenreMultiSelect
                id="favouriteGenres"
                value={form.favouriteGenres}
                onChange={handleGenresChange}
                placeholder="Select the genres you enjoy"
              />
            </div>
          </div>

          <div className="account-card security-card">
            <h2>Security</h2>
            <div className="form-grid">
              <div className="form-row">
                <label htmlFor="password">New password</label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  value={form.password}
                  onChange={handleInputChange}
                  placeholder="Leave blank to keep current password"
                />
                {form.password && (
                  <div className="password-strength">
                    <div className="password-strength__bars">
                      {[0, 1, 2, 3].map((index) => (
                        <span
                          key={index}
                          className={`password-strength__bar ${passwordStrength.score > index ? 'active' : ''}`}
                          style={{
                            backgroundColor: passwordStrength.score > index ? passwordStrength.color : undefined,
                          }}
                        />
                      ))}
                    </div>
                    <span className="password-strength__label" style={{ color: passwordStrength.color }}>
                      {passwordStrength.label}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="account-card reading-card">
            <div className="library-head">
              <h2>Currently reading</h2>
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

          <div className="account-card library-card">
            <div className="library-head">
              <h2>Saved books for later</h2>
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

          <div className="account-actions wide">
            <div className="status-stack">
              {status.message && <p className="status success">{status.message}</p>}
              {status.error && <p className="status error">{status.error}</p>}
            </div>
            <div className="actions-buttons">
              <button type="submit" className="primary-btn" disabled={saving}>
                {saving ? 'Saving...' : 'Save changes'}
              </button>
              <button
                type="button"
                className="danger-btn"
                onClick={() => setConfirmOpen(true)}
                disabled={deleting}
              >
                Delete account
              </button>
            </div>
          </div>
        </form>

        {confirmOpen && (
          <div className="confirm-overlay">
            <div className="confirm-modal">
              <h3>Delete your account?</h3>
              <p>This will permanently remove your profile, preferences, and related progress.</p>
              <div className="confirm-modal__actions">
                <button
                  type="button"
                  className="ghost-btn"
                  onClick={() => setConfirmOpen(false)}
                  disabled={deleting}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="danger-btn"
                  onClick={handleDeleteAccount}
                  disabled={deleting}
                >
                  {deleting ? 'Deleting...' : 'Yes, delete'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

