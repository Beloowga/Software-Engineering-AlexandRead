import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  fetchProfile,
  getCurrentToken,
  getCurrentUser,
  loginUser,
  logoutUser,
  registerUser,
  updateProfile as updateProfileRequest,
  uploadAvatar as uploadAvatarRequest,
  deleteAccount as deleteAccountRequest,
} from '../services/auth.js';
import {
  fetchSavedBookIds,
  removeSavedBook,
  saveBook,
} from '../services/savedBooks.js';
import {
  fetchReadBookIds,
  markBookAsRead,
} from '../services/readBooks.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => getCurrentUser());
  const [initializing, setInitializing] = useState(() => Boolean(getCurrentToken()) && !user);
  const [savedBooks, setSavedBooks] = useState(new Set());
  const [readBooks, setReadBooks] = useState(new Set());

  async function loadSavedBooks() {
    if (!getCurrentToken()) {
      setSavedBooks(new Set());
      return;
    }
    try {
      const ids = await fetchSavedBookIds();
      setSavedBooks(new Set(ids.map((id) => Number(id))));
    } catch (err) {
      console.warn('Unable to load saved books', err);
      setSavedBooks(new Set());
    }
  }

  async function loadReadBooks() {
    if (!getCurrentToken()) {
      setReadBooks(new Set());
      return;
    }
    try {
      const ids = await fetchReadBookIds();
      setReadBooks(new Set(ids.map((id) => Number(id))));
    } catch (err) {
      console.warn('Unable to load read books', err);
      setReadBooks(new Set());
    }
  }

  useEffect(() => {
    async function hydrate() {
      if (!getCurrentToken()) {
        setInitializing(false);
        return;
      }
      try {
        const profile = await fetchProfile();
        setUser(profile);
        await loadSavedBooks();
        await loadReadBooks();
      } catch (err) {
        console.warn('Unable to refresh auth session', err);
        logoutUser();
        setUser(null);
        setSavedBooks(new Set());
        setReadBooks(new Set());
      } finally {
        setInitializing(false);
      }
    }
    hydrate();
  }, []);

  const value = useMemo(() => {
    const isAuthenticated = Boolean(user);
    return {
      user,
      isAuthenticated,
      initializing,
      savedBooks: Array.from(savedBooks),
      readBooks: Array.from(readBooks),
      isBookSaved(bookId) {
        return savedBooks.has(Number(bookId));
      },
      isBookRead(bookId) {
        return readBooks.has(Number(bookId));
      },
      async login(credentials) {
        const profile = await loginUser(credentials);
        setUser(profile);
        await loadSavedBooks();
        await loadReadBooks();
        return profile;
      },
      async register(form) {
        const profile = await registerUser(form);
        setUser(profile);
        await loadSavedBooks();
        await loadReadBooks();
        return profile;
      },
      async refresh() {
        const profile = await fetchProfile();
        setUser(profile);
        await loadSavedBooks();
        await loadReadBooks();
        return profile;
      },
      async updateProfile(updates) {
        const profile = await updateProfileRequest(updates);
        setUser(profile);
        return profile;
      },
      async uploadAvatar(imageDataUrl) {
        const profile = await uploadAvatarRequest(imageDataUrl);
        setUser(profile);
        return profile;
      },
      async toggleSavedBook(bookId) {
        const numericId = Number(bookId);
        if (!numericId || Number.isNaN(numericId)) return;
        if (savedBooks.has(numericId)) {
          await removeSavedBook(numericId);
          setSavedBooks((prev) => {
            const next = new Set(prev);
            next.delete(numericId);
            return next;
          });
        } else {
          await saveBook(numericId);
          setSavedBooks((prev) => {
            const next = new Set(prev);
            next.add(numericId);
            return next;
          });
        }
      },
      async addReadBook(bookId) {
        const numericId = Number(bookId);
        if (!numericId || Number.isNaN(numericId)) return;
        if (!readBooks.has(numericId)) {
          await markBookAsRead(numericId);
          setReadBooks((prev) => {
            const next = new Set(prev);
            next.add(numericId);
            return next;
          });
        }
      },
      async deleteAccount() {
        await deleteAccountRequest();
        setUser(null);
        setSavedBooks(new Set());
        setReadBooks(new Set());
      },
      logout() {
        logoutUser();
        setUser(null);
        setSavedBooks(new Set());
        setReadBooks(new Set());
      },
    };
  }, [user, initializing, savedBooks, readBooks]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside an AuthProvider');
  }
  return context;
}
