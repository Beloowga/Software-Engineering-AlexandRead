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

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => getCurrentUser());
  const [initializing, setInitializing] = useState(() => Boolean(getCurrentToken()) && !user);
  const [savedBooks, setSavedBooks] = useState(new Set());

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
      } catch (err) {
        console.warn('Unable to refresh auth session', err);
        logoutUser();
        setUser(null);
        setSavedBooks(new Set());
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
      isBookSaved(bookId) {
        return savedBooks.has(Number(bookId));
      },
      async login(credentials) {
        const profile = await loginUser(credentials);
        setUser(profile);
        await loadSavedBooks();
        return profile;
      },
      async register(form) {
        const profile = await registerUser(form);
        setUser(profile);
        await loadSavedBooks();
        return profile;
      },
      async refresh() {
        const profile = await fetchProfile();
        setUser(profile);
        await loadSavedBooks();
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
      async deleteAccount() {
        await deleteAccountRequest();
        setUser(null);
        setSavedBooks(new Set());
      },
      logout() {
        logoutUser();
        setUser(null);
        setSavedBooks(new Set());
      },
    };
  }, [user, initializing, savedBooks]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside an AuthProvider');
  }
  return context;
}
