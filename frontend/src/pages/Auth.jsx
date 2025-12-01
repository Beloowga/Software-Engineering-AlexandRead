import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { isValidEmail, getPasswordStrength } from '../utils/validators.js';
import GenreMultiSelect from '../components/GenreMultiSelect.jsx';

const loginInitialState = {
  email: '',
  password: '',
};

const registerInitialState = {
  pseudo: '',
  name: '',
  email: '',
  password: '',
  dateOfBirth: '',
  region: '',
  favouriteBook: '',
  favouriteAuthor: '',
  favouriteGenres: [],
};

export default function AuthPage() {
  const { isAuthenticated, login, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mode, setMode] = useState(location.state?.mode || 'signin');
  const [form, setForm] = useState(
    mode === 'signin' ? loginInitialState : registerInitialState,
  );
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [touched, setTouched] = useState({ email: false });
  const from = location.state?.from || '/';
  const emailValid = isValidEmail(form.email);
  const passwordStrength = getPasswordStrength(form.password);

  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);

  useEffect(() => {
    setForm(mode === 'signin' ? loginInitialState : registerInitialState);
    setError('');
    setTouched({ email: false });
  }, [mode]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleGenresChange = (selectedGenres) => {
    setForm((prev) => ({ ...prev, favouriteGenres: selectedGenres }));
  };

  const setFieldTouched = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setFieldTouched('email');
    if (!emailValid) {
      setError('Please enter a valid email address.');
      return;
    }
    setLoading(true);
    try {
      if (mode === 'signin') {
        await login(form);
      } else {
        await register(form);
      }
      navigate(from, { replace: true });
    } catch (err) {
      const message = err?.response?.data?.error || err.message || 'Unable to process your request.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="auth-page">
      <div className="account-background" aria-hidden="true" />
      <div className="auth-card">
        <div className="auth-header">
          <h1>{mode === 'signin' ? 'Sign in to your account' : 'Create an account'}</h1>
          <p>Connect to unlock your personalised AlexandRead experience.</p>
        </div>

        <div className="auth-toggle">
          <button
            type="button"
            className={mode === 'signin' ? 'active' : ''}
            onClick={() => setMode('signin')}
          >
            Sign in
          </button>
          <button
            type="button"
            className={mode === 'register' ? 'active' : ''}
            onClick={() => setMode('register')}
          >
            Register
          </button>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          {mode === 'register' && (
            <>
              <div className="form-row">
                <label htmlFor="pseudo">Pseudo</label>
                <input
                  id="pseudo"
                  name="pseudo"
                  type="text"
                  value={form.pseudo}
                  onChange={handleChange}
                  placeholder="Bookworm42"
                  required
                />
              </div>

              <div className="form-row">
                <label htmlFor="name">Name</label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Ada Lovelace"
                  required
                />
              </div>
            </>
          )}

          <div className="form-row">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              onBlur={() => setFieldTouched('email')}
              placeholder="you@example.com"
              required
              className={!emailValid && touched.email ? 'invalid' : ''}
            />
            {touched.email && !emailValid && (
              <p className="input-hint error">Please enter a valid email address.</p>
            )}
          </div>

          <div className="form-row">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              placeholder="********"
              required
            />
            {mode === 'register' && form.password && (
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

          {mode === 'register' && (
            <>
              <div className="form-row">
                <label htmlFor="dateOfBirth">Date of birth</label>
                <input
                  id="dateOfBirth"
                  name="dateOfBirth"
                  type="date"
                  value={form.dateOfBirth}
                  onChange={handleChange}
                />
              </div>

              <div className="form-row">
                <label htmlFor="region">Region</label>
                <input
                  id="region"
                  name="region"
                  type="text"
                  value={form.region}
                  onChange={handleChange}
                  placeholder="Ile-de-France"
                />
              </div>

              <div className="form-row">
                <label htmlFor="favouriteBook">Favourite book</label>
                <input
                  id="favouriteBook"
                  name="favouriteBook"
                  type="text"
                  value={form.favouriteBook}
                  onChange={handleChange}
                  placeholder="Dune"
                />
              </div>

              <div className="form-row">
                <label htmlFor="favouriteAuthor">Favourite author</label>
                <input
                  id="favouriteAuthor"
                  name="favouriteAuthor"
                  type="text"
                  value={form.favouriteAuthor}
                  onChange={handleChange}
                  placeholder="Octavia Butler"
                />
              </div>

              <div className="form-row">
                <label htmlFor="favouriteGenres">Favourite genres</label>
                <GenreMultiSelect
                  id="favouriteGenres"
                  value={form.favouriteGenres}
                  onChange={handleGenresChange}
                  placeholder="Select the genres you enjoy"
                />
              </div>
            </>
          )}

          {error && <p className="form-error">{error}</p>}

          <button type="submit" className="primary-btn" disabled={loading}>
            {loading ? 'Please wait...' : mode === 'signin' ? 'Sign in' : 'Register'}
          </button>
        </form>
      </div>
    </section>
  );
}
